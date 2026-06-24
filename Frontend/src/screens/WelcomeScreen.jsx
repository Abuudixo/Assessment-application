import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";

const { width, height } = Dimensions.get("window");

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

export default function WelcomeScreen({ navigation }) {
  const [user, setUser] = React.useState(null);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const scaleBtn = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    import("../api").then(({ getUser }) => {
      getUser().then((u) => {
        if (u) {
          setUser(u);
          if (u.is_admin) {
            navigation.reset({ index: 0, routes: [{ name: "Admin" }] });
          }
        }
      });
    });

    Animated.stagger(150, [
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
      ]),
      Animated.spring(scaleBtn, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogout = async () => {
    const { removeToken, removeUser } = await import("../api");
    await removeToken();
    await removeUser();
    setUser(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Auth Header */}
      <View
        style={{
          position: "absolute",
          top: 50,
          right: 24,
          zIndex: 10,
        }}
      >
        {user ? (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ color: COLORS.textMuted, marginRight: 12, fontWeight: "500" }}>
              Hi, {user.name?.split(" ")[0] || "User"}
            </Text>
            <TouchableOpacity onPress={handleLogout}>
              <Text style={{ color: COLORS.primary, fontWeight: "700" }}>
                Bax
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: COLORS.card,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text style={{ color: COLORS.text, fontWeight: "600" }}>
              Soo Gal
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 32,
        }}
      >
        {/* Logo / Icon */}
        <Animated.View
          style={{
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
            marginBottom: 24,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 16,
              backgroundColor: COLORS.card,
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 1,
              borderColor: COLORS.border,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 40 }}>🧠</Text>
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.Text
          style={{
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
            fontSize: 36,
            fontWeight: "800",
            color: COLORS.text,
            textAlign: "center",
            marginBottom: 12,
            letterSpacing: -0.5,
          }}
        >
          MindBridge
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          style={{
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
            fontSize: 16,
            color: COLORS.textMuted,
            textAlign: "center",
            lineHeight: 24,
            marginBottom: 48,
            maxWidth: 320,
          }}
        >
          Baaritaanka caafimaadka maskaxda ee AI ku shaqeeya. Jawaab 25 su'aalood
          si aad u hesho natiijaada.
        </Animated.Text>

        {/* Feature pills */}
        <Animated.View
          style={{
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 12,
            marginBottom: 48,
          }}
        >
          {["🛡️ Sirta", "🤖 AI Model", "📊 Natiijada", "⚡ Deg-deg"].map(
            (label, i) => (
              <View
                key={i}
                style={{
                  backgroundColor: COLORS.card,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: "500" }}>
                  {label}
                </Text>
              </View>
            )
          )}
        </Animated.View>

        {/* CTA Button */}
        <Animated.View style={{ transform: [{ scale: scaleBtn }], width: "100%" }}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Quiz")}
            activeOpacity={0.9}
            style={{
              backgroundColor: COLORS.primary,
              paddingVertical: 16,
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              Bilow Baaritaanka →
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <Animated.Text
          style={{
            opacity: fadeIn,
            marginTop: 32,
            fontSize: 13,
            color: COLORS.textMuted,
            textAlign: "center",
          }}
        >
          Macluumaadkaaga waa sir • v1.0
        </Animated.Text>
      </View>
    </View>
  );
}
