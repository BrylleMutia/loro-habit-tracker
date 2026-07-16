import "./global.css";

import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "./src/contexts/authContext";
import { RootGate } from "./src/navigation/RootGate";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootGate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
