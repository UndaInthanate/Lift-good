import * as ImagePicker from 'expo-image-picker';

export interface ScannedReceipt {
  uri: string;
  amount?: number;
  date?: string; // YYYY-MM-DD
}

/** Open camera or gallery and return the picked image URI (null if cancelled). */
export async function pickReceiptImage(fromCamera: boolean): Promise<string | null> {
  if (fromCamera) {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return null;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    return result.canceled ? null : result.assets[0].uri;
  }
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
  });
  return result.canceled ? null : result.assets[0].uri;
}

/**
 * OCR hook: read amount + date from a receipt/slip image.
 *
 * The app is fully local with no backend, so no OCR engine ships by default —
 * this returns only the URI and the user fills the fields manually. To enable
 * AI extraction, plug a vision model call in here (e.g. send base64 of the
 * image to the Claude API and parse {"amount", "date"} from the response).
 */
export async function scanReceipt(uri: string): Promise<ScannedReceipt> {
  return { uri };
}
