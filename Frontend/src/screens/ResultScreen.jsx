import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Platform,
} from "react-native";
import { predict, createAssessment, getToken } from "../api";

const { width } = Dimensions.get("window");

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

const CONDITION_CONFIG = {
  Healthy: {
    icon: "✅",
    color: COLORS.success,
    label: "Caafimaad Qab",
    description: "Natiijadaadu waxay muujinaysaa inaad xaalad caafimaad fiican ku jirto.",
  },
  Anxiety: {
    icon: "😰",
    color: COLORS.danger,
    label: "Walwal (Anxiety)",
    description: "Natiijadaadu waxay muujinaysaa calaamado walwal ah. La tashi dhakhtar.",
  },
  Depression: {
    icon: "😞",
    color: COLORS.primary,
    label: "Niyadjab (Depression)",
    description: "Natiijadaadu waxay muujinaysaa calaamado niyadjab. Raadi caawimo xirfadle.",
  },
  ADHD: {
    icon: "🎯",
    color: COLORS.primary,
    label: "ADHD",
    description: "Natiijadaadu waxay muujinaysaa calaamado feejignaansho la'aan. La hadal xirfadle.",
  },
  PTSD: {
    icon: "💔",
    color: COLORS.danger,
    label: "Naxdin (PTSD)",
    description: "Natiijadaadu waxay muujinaysaa calaamado dhacdooyinkii hore. Raadi caawimo.",
  },
};

const CATEGORY_LABELS = {
  anxiety_score: { label: "Walwal", icon: "😰", color: COLORS.danger },
  depression_score: { label: "Niyadjab", icon: "😞", color: COLORS.primary },
  stress_score: { label: "Culays", icon: "😤", color: COLORS.warning },
  attention_score: { label: "Feejignaansho", icon: "🎯", color: COLORS.primary },
  trauma_score: { label: "Naxdin", icon: "💔", color: COLORS.danger },
};

const ConfidenceRing = ({ percentage, color, size = 120 }) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: percentage,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: COLORS.border,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.card,
      }}
    >
      <View
        style={{
          position: "absolute",
          top: -2,
          left: -2,
          right: -2,
          bottom: -2,
          borderRadius: (size + 4) / 2,
          borderWidth: 4,
          borderColor: "transparent",
          borderTopColor: color,
          borderRightColor: percentage > 25 ? color : "transparent",
          borderBottomColor: percentage > 50 ? color : "transparent",
          borderLeftColor: percentage > 75 ? color : "transparent",
        }}
      />
      <Text
        style={{
          fontSize: 28,
          fontWeight: "800",
          color: color,
        }}
      >
        {Math.round(percentage)}%
      </Text>
      <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2, fontWeight: "500" }}>
        Kalsooni
      </Text>
    </View>
  );
};

const CategoryBar = ({ label, icon, score, maxScore, color }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const pct = (score / maxScore) * 100;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 800,
      delay: 300,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={{ marginBottom: 14 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: "600" }}>
          {icon} {label}
        </Text>
        <Text style={{ color: COLORS.textMuted, fontSize: 13, fontWeight: "500" }}>
          {score} / {maxScore}
        </Text>
      </View>
      <View
        style={{
          height: 8,
          backgroundColor: COLORS.bg,
          borderRadius: 4,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: COLORS.border,
        }}
      >
        <Animated.View
          style={{
            height: "100%",
            borderRadius: 4,
            backgroundColor: color,
            width: widthAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ["0%", "100%"],
            }),
          }}
        />
      </View>
    </View>
  );
};

export default function ResultScreen({ route, navigation }) {
  const { answers } = route.params;
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchPrediction();
  }, []);

  const fetchPrediction = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getToken();
      let response;
      if (token) {
        response = await createAssessment(answers);
        setResult(response.data.result);
      } else {
        response = await predict(answers);
        setResult(response.data);
      }
      
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.error("Prediction error:", err);
      setError(
        err.response?.data?.detail ||
          "Server-ka lama xiriiri karo. Hubi inuu shaqeynayo."
      );
    } finally {
      setLoading(false);
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.bg,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 16,
            backgroundColor: COLORS.card,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 24,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
        <Text
          style={{ color: COLORS.text, fontSize: 18, fontWeight: "700", marginBottom: 8 }}
        >
          Falanqaynta natiijooyinka...
        </Text>
        <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>
          AI model-ka ayaa shaqeynaya
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.bg,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 32,
        }}
      >
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
        <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
        <Text
          style={{
            color: COLORS.danger,
            fontSize: 18,
            fontWeight: "700",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Khalad ayaa dhacay
        </Text>
        <Text
          style={{
            color: COLORS.textMuted,
            fontSize: 14,
            textAlign: "center",
            marginBottom: 32,
            lineHeight: 22,
          }}
        >
          {error}
        </Text>
        <TouchableOpacity
          onPress={fetchPrediction}
          style={{
            backgroundColor: COLORS.primary,
            paddingVertical: 14,
            paddingHorizontal: 32,
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
            Isku day mar kale
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("Welcome")}
          style={{
            paddingVertical: 14,
            paddingHorizontal: 32,
          }}
        >
          <Text style={{ color: COLORS.textMuted, fontSize: 14, fontWeight: "600" }}>
            ← Bogga hore
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const condition = CONDITION_CONFIG[result.predicted_condition] || {
    icon: "❓",
    color: COLORS.primary,
    label: result.predicted_condition,
    description: "",
  };
  const confidencePct = (result.confidence_score * 100);

  const riskColors = {
    High: COLORS.danger,
    Medium: COLORS.warning,
    Low: COLORS.success,
  };
  const riskLabels = {
    High: "Sare",
    Medium: "Dhexe",
    Low: "Hoose",
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <ScrollView
        contentContainerStyle={{ paddingTop: 56, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeIn }}>
          {/* Header */}
          <View style={{ alignItems: "center", paddingHorizontal: 24 }}>
            <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 8, fontWeight: "600" }}>
              NATIIJOOYINKA BAARITAANKA
            </Text>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "800",
                color: COLORS.text,
                marginBottom: 32,
              }}
            >
              Warbixintaada
            </Text>
          </View>

          {/* Main result card */}
          <View
            style={{
              marginHorizontal: 24,
              backgroundColor: COLORS.card,
              borderRadius: 16,
              padding: 28,
              alignItems: "center",
              borderWidth: 1,
              borderColor: COLORS.border,
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 56, marginBottom: 12 }}>
              {condition.icon}
            </Text>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "800",
                color: condition.color,
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              {condition.label}
            </Text>
            <Text
              style={{
                color: COLORS.textMuted,
                fontSize: 14,
                textAlign: "center",
                lineHeight: 22,
                marginBottom: 24,
                maxWidth: 280,
                fontWeight: "500"
              }}
            >
              {condition.description}
            </Text>

            {/* Confidence ring */}
            <ConfidenceRing
              percentage={confidencePct}
              color={condition.color}
            />

            {/* Risk level badge */}
            <View
              style={{
                marginTop: 24,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: COLORS.card,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: riskColors[result.risk_level] || COLORS.primary,
              }}
            >
              <Text style={{ fontSize: 14, marginRight: 6 }}>⚡</Text>
              <Text
                style={{
                  color: riskColors[result.risk_level] || COLORS.primary,
                  fontWeight: "700",
                  fontSize: 14,
                }}
              >
                Heerka Khatarta:{" "}
                {riskLabels[result.risk_level] || result.risk_level}
              </Text>
            </View>
          </View>

          {/* Category breakdown */}
          {result.category_scores && (
            <View
              style={{
                marginHorizontal: 24,
                backgroundColor: COLORS.card,
                borderRadius: 16,
                padding: 24,
                borderWidth: 1,
                borderColor: COLORS.border,
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 17,
                  fontWeight: "800",
                  marginBottom: 20,
                }}
              >
                📊 Falanqaynta Qaybaha
              </Text>
              {Object.entries(result.category_scores).map(([key, score]) => {
                const cat = CATEGORY_LABELS[key];
                if (!cat) return null;
                return (
                  <CategoryBar
                    key={key}
                    label={cat.label}
                    icon={cat.icon}
                    score={score}
                    maxScore={15}
                    color={cat.color}
                  />
                );
              })}
            </View>
          )}

          {/* Raw probabilities */}
          {result.raw_probabilities && (
            <View
              style={{
                marginHorizontal: 24,
                backgroundColor: COLORS.card,
                borderRadius: 16,
                padding: 24,
                borderWidth: 1,
                borderColor: COLORS.border,
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 17,
                  fontWeight: "800",
                  marginBottom: 16,
                }}
              >
                🤖 Natiijooyinka AI Model
              </Text>
              {Object.entries(result.raw_probabilities)
                .sort(([, a], [, b]) => b - a)
                .map(([label, prob]) => {
                  const pct = (prob * 100).toFixed(1);
                  const cfg = CONDITION_CONFIG[label];
                  return (
                    <View
                      key={label}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: COLORS.border,
                      }}
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Text style={{ fontSize: 16, marginRight: 8 }}>
                          {cfg?.icon || "❓"}
                        </Text>
                        <Text
                          style={{
                            color: COLORS.text,
                            fontSize: 15,
                            fontWeight: "600",
                          }}
                        >
                          {cfg?.label || label}
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: cfg?.color || COLORS.textMuted,
                          fontSize: 15,
                          fontWeight: "700",
                        }}
                      >
                        {pct}%
                      </Text>
                    </View>
                  );
                })}
            </View>
          )}

          {/* Actions */}
          <View style={{ paddingHorizontal: 24, marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate("Welcome")}
              activeOpacity={0.9}
              style={{
                backgroundColor: COLORS.primary,
                paddingVertical: 18,
                borderRadius: 8,
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                🔄 Dib u bilow
              </Text>
            </TouchableOpacity>

            {/* Disclaimer */}
            <View
              style={{
                backgroundColor: "#FEF3C7", // lighter warning background
                borderRadius: 8,
                padding: 16,
                borderWidth: 1,
                borderColor: COLORS.warning,
              }}
            >
              <Text
                style={{
                  color: COLORS.warning,
                  fontSize: 13,
                  fontWeight: "700",
                  marginBottom: 6,
                }}
              >
                ⚠️ Ogeysiis Muhiim ah
              </Text>
              <Text
                style={{
                  color: COLORS.textMuted,
                  fontSize: 13,
                  lineHeight: 20,
                  fontWeight: "500",
                }}
              >
                Natiijadan waa qiyaas AI ah, ma aha caafimaad rasmi ah. Fadlan la
                tashi dhakhtar aqoon u leh caafimaadka maskaxda.
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
