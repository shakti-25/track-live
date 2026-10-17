import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;
const GOOGLE_FORM_RESPONSE_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSeOk9VFaCsynaNm6ACAzyadizBBH4OVPI5rlCjuQK5ax-1VUQ/formResponse';

const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: !!apiKey,
    time: new Date().toISOString(),
  });
});

/**
 * Google Maps Grounding endpoint using gemini-3.8-flash with googleMaps tool.
 * Provides verified address, place recognition, landmarks, and grounding URLs.
 */
app.post('/api/maps/grounding', async (req, res) => {
  try {
    const { latitude, longitude, clientName } = req.body;

    if (latitude === undefined || longitude === undefined) {
      res.status(400).json({ error: 'Latitude and longitude are required' });
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ error: 'Invalid coordinates' });
      return;
    }

    let groundingResult = {
      verifiedAddress: '',
      locality: '',
      landmark: '',
      description: '',
      places: [] as Array<{ title: string; uri: string; snippet?: string }>,
      source: 'coordinates_only',
      fetchedAt: Date.now(),
    };

    // 1. Try Gemini Maps Grounding if API key is present
    if (ai) {
      try {
        const prompt = clientName
          ? `Verify the physical address, area/locality name, nearest landmark, and commercial/business establishment at GPS coordinates latitude ${lat}, longitude ${lng}. The salesperson is visiting client: "${clientName}". Provide a concise location verification summary.`
          : `Verify the physical address, neighborhood/locality, city, nearest landmark, and notable commercial establishments at GPS coordinates: latitude ${lat}, longitude ${lng}. Provide a concise location summary for a field sales visit record.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
              retrievalConfig: {
                latLng: {
                  latitude: lat,
                  longitude: lng,
                },
              },
            },
          },
        });

        const textOutput = response.text || '';
        groundingResult.description = textOutput;
        groundingResult.source = 'gemini_maps_grounding';

        // Extract grounding chunks as required by the Gemini Maps Grounding specification
        const candidate = response.candidates?.[0];
        // @ts-ignore
        const metadata = candidate?.groundingMetadata;
        const chunks = metadata?.groundingChunks || [];

        const places: Array<{ title: string; uri: string; snippet?: string }> = [];

        for (const chunk of chunks) {
          // Chunk structure in Google Maps grounding can contain chunk.maps
          if (chunk?.maps) {
            const mapsObj = chunk.maps as any;
            const uri = mapsObj.uri || mapsObj.googleMapsUri || '';
            const title = mapsObj.title || mapsObj.name || 'View on Google Maps';
            if (uri) {
              places.push({ title, uri });
            }
          }
          // Also check web / placeAnswerSources
          if (chunk?.web?.uri) {
            places.push({
              title: chunk.web.title || 'Location Reference',
              uri: chunk.web.uri,
            });
          }
        }

        // Always ensure at least the direct coordinate pin is in places
        const directMapsPin = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
        if (!places.some((p) => p.uri === directMapsPin)) {
          places.unshift({
            title: `GPS Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
            uri: directMapsPin,
          });
        }

        groundingResult.places = places;

        // Extract first line of summary as verifiedAddress if available
        const lines = textOutput.split('\n').filter((l) => l.trim().length > 0);
        groundingResult.verifiedAddress =
          lines.find((l) => !l.startsWith('#') && l.length > 5) ||
          `Lat ${lat.toFixed(6)}, Lng ${lng.toFixed(6)}`;
      } catch (geminiError: any) {
        console.warn('Gemini Maps Grounding failed or quota exceeded:', geminiError?.message);
      }
    }

    // 2. If verifiedAddress not set yet, attempt reverse geocoding fallback
    if (!groundingResult.verifiedAddress || groundingResult.source === 'coordinates_only') {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
          {
            headers: {
              'User-Agent': 'SalesTrack-GPS/1.0 (build-app)',
            },
          }
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData?.display_name) {
            groundingResult.verifiedAddress = geoData.display_name;
            groundingResult.locality =
              geoData.address?.suburb || geoData.address?.neighbourhood || geoData.address?.city || '';
            groundingResult.landmark =
              geoData.address?.building || geoData.address?.amenity || '';
            if (groundingResult.source === 'coordinates_only') {
              groundingResult.source = 'reverse_geocoding';
              groundingResult.description = `Verified address at ${geoData.display_name}. Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}.`;
              groundingResult.places.push({
                title: 'Google Maps Pin',
                uri: `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`,
              });
            }
          }
        }
      } catch (geoErr) {
        console.warn('Reverse geocode fallback failed:', geoErr);
      }
    }

    // Final fallback
    if (!groundingResult.verifiedAddress) {
      groundingResult.verifiedAddress = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
      groundingResult.places = [
        {
          title: `Google Maps Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          uri: `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`,
        },
      ];
    }

    res.json(groundingResult);
  } catch (error: any) {
    console.error('Error in /api/maps/grounding:', error);
    res.status(500).json({ error: error?.message || 'Failed to ground location' });
  }
});

/**
 * Proxy submission directly to Google Forms
 */
app.post('/api/form/submit', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      res.status(400).json({ error: 'Payload is required' });
      return;
    }

    const formParams = new URLSearchParams();
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined && value !== null) {
        formParams.append(key, String(value));
      }
    }

    const gResponse = await fetch(GOOGLE_FORM_RESPONSE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: formParams.toString(),
      redirect: 'manual',
    });

    // Google Forms returns 200 or 302 on valid form submission
    const isSuccess =
      gResponse.status === 200 ||
      gResponse.status === 302 ||
      gResponse.status === 303;

    res.json({
      success: isSuccess,
      status: gResponse.status,
      timestamp: Date.now(),
      message: isSuccess
        ? 'Successfully submitted to Google Form'
        : `Google Form responded with status ${gResponse.status}`,
    });
  } catch (err: any) {
    console.error('Error proxying to Google Form:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to submit to Google Form',
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const path = await import('path');
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SalesTrack GPS server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
