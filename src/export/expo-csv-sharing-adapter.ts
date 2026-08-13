import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { NativeCsvFileService } from "./native-csv-file-service";

/** Creates the platform adapter only at the native UI boundary. */
export function createExpoCsvFileService(): NativeCsvFileService {
  return new NativeCsvFileService(
    {
      cacheDirectory: FileSystem.cacheDirectory,
      writeAsStringAsync: async (uri, contents) => {
        await FileSystem.writeAsStringAsync(uri, contents, { encoding: FileSystem.EncodingType.UTF8 });
      },
    },
    {
      isAvailableAsync: () => Sharing.isAvailableAsync(),
      shareAsync: (uri, options) => Sharing.shareAsync(uri, options),
    },
    Platform.OS,
  );
}
