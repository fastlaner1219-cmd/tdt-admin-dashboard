import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xpwzcikudbrgtulcdwft.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwd3pjaWt1ZGJyZ3R1bGNkd2Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODkxNjUsImV4cCI6MjA5NDI2NTE2NX0.utDP37w9LYuIki2zD-AS-jGIrD1XbedoPvUf2q2twf8';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function parseWKBPoint(hex) {
  if (!hex || hex.length !== 50) return null;
  const lngHex = hex.substring(18, 34);
  const latHex = hex.substring(34, 50);
  const parseDouble = (h) => {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    for (let i = 0; i < 8; i++) {
      view.setUint8(i, parseInt(h.substring(i*2, i*2+2), 16));
    }
    return view.getFloat64(0, true); 
  };
  return { lng: parseDouble(lngHex), lat: parseDouble(latHex) };
}

async function test() {
  const { data, error } = await supabase.from('tdt_gps_logs').select('staff_id, location, recorded_at').limit(1);
  console.log('Error:', error);
  if (data && data.length > 0) {
    const wkb = data[0].location;
    console.log('WKB:', wkb);
    console.log('Parsed:', parseWKBPoint(wkb));
  }
}
test();
