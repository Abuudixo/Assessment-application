import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { login as apiLogin, saveToken, saveUser, getMe } from "../api";

const COLORS = {
  bg: "#F4F4F1",
  card: "#FFFFFF",
  border: "#E5E5E5",
  text: "#0C0C09",
  textMuted: "#666666",
  primary: "#0C0C09",
  success: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626"
};

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Fadlan geli email-ka iyo password-ka");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiLogin(email.trim(), password);
      await saveToken(res.data.access_token);

      // Get user info
      const meRes = await getMe();
      await saveUser(meRes.data);

      if (meRes.data.is_admin) {
        navigation.reset({ index: 0, routes: [{ name: "Admin" }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
      }
    } catch (err) {
      const msg =
        err.response?.data?.detail || "Login wuu fashilmay. Isku day mar kale.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          flex: 1,
          justifyContent: "center",
          paddingHorizontal: 28,
        }}
      >
        <Animated.View
          style={{
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          }}
        >
          {/* Logo */}
          <View style={{ alignItems: "center", marginBottom: 12 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 16,
                backgroundColor: COLORS.card,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text style={{ fontSize: 36 }}>🧠</Text>
            </View>
          </View>

          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              color: COLORS.text,
              textAlign: "center",
              marginBottom: 6,
            }}
          >
            Soo Gal
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: COLORS.textMuted,
              textAlign: "center",
              marginBottom: 36,
            }}
          >
            Geli xogtaada si aad u gasho
          </Text>

          {/* Error */}
          {error ? (
            <View
              style={{
                backgroundColor: "#FEE2E2",
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: COLORS.danger,
              }}
            >
              <Text
                style={{
                  color: COLORS.danger,
                  fontSize: 13,
                  textAlign: "center",
                  fontWeight: "500",
                }}
              >
                {error}
              </Text>
            </View>
          ) : null}

          {/* Email */}
          <Text
            style={{
              color: COLORS.textMuted,
              fontSize: 13,
              marginBottom: 6,
              fontWeight: "600",
            }}
          >
            Email
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={COLORS.textMuted + "88"}
            keyboardType="email-address"
            autoCapitalize="none"
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 8,
              padding: 16,
              color: COLORS.text,
              fontSize: 15,
              borderWidth: 1,
              borderColor: COLORS.border,
              marginBottom: 16,
            }}
          />

          {/* Password */}
          <Text
            style={{
              color: COLORS.textMuted,
              fontSize: 13,
              marginBottom: 6,
              fontWeight: "600",
            }}
          >
            Password
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={COLORS.textMuted + "88"}
            secureTextEntry
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 8,
              padding: 16,
              color: COLORS.text,
              fontSize: 15,
              borderWidth: 1,
              borderColor: COLORS.border,
              marginBottom: 28,
            }}
          />

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.9}
            style={{
              backgroundColor: COLORS.primary,
              paddingVertical: 16,
              borderRadius: 8,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={{
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                Soo Gal →
              </Text>
            )}
          </TouchableOpacity>

          {/* Register link */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Register")}
            style={{ alignItems: "center", paddingVertical: 8 }}
          >
            <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>
              Ma haysatid akoon?{" "}
              <Text style={{ color: COLORS.primary, fontWeight: "700" }}>
                Is Diiwaangeli
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Skip (guest) */}
          <TouchableOpacity
            onPress={() =>
              navigation.reset({ index: 0, routes: [{ name: "Welcome" }] })
            }
            style={{ alignItems: "center", paddingVertical: 8, marginTop: 4 }}
          >
            <Text style={{ color: COLORS.textMuted, fontSize: 13, fontWeight: "500" }}>
              Sii wad martiqaad ahaan →
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}
