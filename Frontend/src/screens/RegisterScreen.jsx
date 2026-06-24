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
  ScrollView,
} from "react-native";
import { register as apiRegister, saveToken, saveUser, getMe } from "../api";

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

const InputField = ({ label, value, onChangeText, placeholder, secure, keyboardType }) => (
  <View style={{ marginBottom: 16 }}>
    <Text
      style={{
        color: COLORS.textMuted,
        fontSize: 13,
        marginBottom: 6,
        fontWeight: "600",
      }}
    >
      {label}
    </Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textMuted + "88"}
      secureTextEntry={secure}
      keyboardType={keyboardType || "default"}
      autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
      style={{
        backgroundColor: COLORS.card,
        borderRadius: 8,
        padding: 16,
        color: COLORS.text,
        fontSize: 15,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    />
  </View>
);

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Fadlan buuxi dhammaan meelaha");
      return;
    }
    if (password !== confirmPassword) {
      setError("Password-yada ma isu eka");
      return;
    }
    if (password.length < 6) {
      setError("Password-ka waa inuu ka badan yahay 6 xaraf");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiRegister(email.trim(), password, name.trim());
      await saveToken(res.data.access_token);

      const meRes = await getMe();
      await saveUser(meRes.data);

      navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        "Diiwaangelinta waa ay fashilantay. Isku day mar kale.";
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
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 28,
            paddingVertical: 40,
          }}
          showsVerticalScrollIndicator={false}
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
                <Text style={{ fontSize: 36 }}>✨</Text>
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
              Is Diiwaangeli
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: COLORS.textMuted,
                textAlign: "center",
                marginBottom: 32,
              }}
            >
              Samayso akoon cusub oo bilow
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

            <InputField
              label="Magacaaga"
              value={name}
              onChangeText={setName}
              placeholder="Magacaaga geli"
            />
            <InputField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
            />
            <InputField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secure
            />
            <InputField
              label="Xaqiiji Password-ka"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              secure
            />

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.9}
              style={{
                backgroundColor: COLORS.primary,
                paddingVertical: 16,
                borderRadius: 8,
                alignItems: "center",
                marginTop: 12,
                marginBottom: 16,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  Is Diiwaangeli ✓
                </Text>
              )}
            </TouchableOpacity>

            {/* Login link */}
            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              style={{ alignItems: "center", paddingVertical: 8 }}
            >
              <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>
                Hore ma u diiwaangashan tahay?{" "}
                <Text style={{ color: COLORS.primary, fontWeight: "700" }}>
                  Soo Gal
                </Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
