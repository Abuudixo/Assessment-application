import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { questions as originalQuestions, responseOptions } from "../data/questions";

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

const CATEGORY_ICONS = {
  Anxiety: "😰",
  Depression: "😞",
  Stress: "😤",
  Attention: "🎯",
  Trauma: "💔",
};

export default function QuizScreen({ navigation }) {
  // Shuffle questions randomly once when the component mounts
  const questions = useMemo(() => {
    return [...originalQuestions].sort(() => Math.random() - 0.5);
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const currentQ = questions[currentIndex];
  const progress = (currentIndex + 1) / questions.length;
  const isAnswered = answers[currentQ.id] !== undefined;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [currentIndex]);

  const animateTransition = (direction, callback) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction === "next" ? -30 : 30,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(direction === "next" ? 30 : -30);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleSelect = (value) => {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: value }));

    // Auto-advance after a short delay
    if (currentIndex < questions.length - 1) {
      setTimeout(() => {
        animateTransition("next", () => setCurrentIndex((i) => i + 1));
      }, 300);
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      animateTransition("prev", () => setCurrentIndex((i) => i - 1));
    }
  };

  const handleSubmit = () => {
    // Fill missing answers with 0 (default lowest score) so the ML model doesn't fail
    const completeAnswers = { ...answers };
    questions.forEach((q) => {
      if (completeAnswers[q.id] === undefined) {
        completeAnswers[q.id] = 0;
      }
    });
    navigation.navigate("Result", { answers: completeAnswers });
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View
        style={{
          paddingTop: 56,
          paddingHorizontal: 24,
          paddingBottom: 16,
        }}
      >
        {/* Back arrow */}
        <TouchableOpacity
          onPress={() => navigation.navigate("Welcome")}
          activeOpacity={0.7}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 18, color: COLORS.text }}>←</Text>
        </TouchableOpacity>

        {/* Progress bar */}
        <View
          style={{
            height: 6,
            backgroundColor: COLORS.card,
            borderRadius: 3,
            overflow: "hidden",
            marginBottom: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Animated.View
            style={{
              height: "100%",
              borderRadius: 3,
              backgroundColor: COLORS.primary,
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            }}
          />
        </View>

        {/* Question counter */}
        <Text style={{ color: COLORS.textMuted, fontSize: 14, fontWeight: "500" }}>
          Su'aal {currentIndex + 1}{" "}
          <Text style={{ color: COLORS.textMuted }}>
            / {questions.length}
          </Text>
        </Text>
      </View>

      {/* Question card */}
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          }}
        >
          {/* Question text */}
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 8,
              padding: 24,
              marginTop: 8,
              marginBottom: 28,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text
              style={{
                color: COLORS.text,
                fontSize: 18,
                fontWeight: "700",
                lineHeight: 28,
              }}
            >
              {currentQ.question}
            </Text>
          </View>

          {/* Response options */}
          {responseOptions.map((option, index) => {
            const isSelected = answers[currentQ.id] === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => handleSelect(option.value)}
                activeOpacity={0.9}
                style={{
                  backgroundColor: isSelected
                    ? COLORS.border
                    : COLORS.card,
                  borderRadius: 8,
                  padding: 18,
                  marginBottom: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: isSelected ? COLORS.primary : COLORS.border,
                }}
              >
                {/* Number circle */}
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: isSelected
                      ? COLORS.primary
                      : COLORS.bg,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 14,
                    borderWidth: isSelected ? 0 : 1,
                    borderColor: COLORS.border,
                  }}
                >
                  <Text
                    style={{
                      color: isSelected ? "#FFFFFF" : COLORS.textMuted,
                      fontSize: 14,
                      fontWeight: "700",
                    }}
                  >
                    {option.value}
                  </Text>
                </View>

                <Text
                  style={{
                    color: isSelected ? COLORS.primary : COLORS.text,
                    fontSize: 15,
                    fontWeight: isSelected ? "700" : "500",
                    flex: 1,
                  }}
                >
                  {option.label}
                </Text>

                {isSelected && (
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: COLORS.primary,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#FFFFFF", fontSize: 14 }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </ScrollView>

      {/* Bottom navigation */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 24,
          paddingVertical: 20,
          paddingBottom: 36,
          gap: 12,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          backgroundColor: COLORS.card,
        }}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={goBack}
          disabled={currentIndex === 0}
          activeOpacity={0.9}
          style={{
            flex: 1,
            paddingVertical: 16,
            borderRadius: 8,
            alignItems: "center",
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
            opacity: currentIndex === 0 ? 0.4 : 1,
          }}
        >
          <Text
            style={{
              color: COLORS.text,
              fontSize: 15,
              fontWeight: "600",
            }}
          >
            ← Dib
          </Text>
        </TouchableOpacity>

        {/* Next / Submit button */}
        {currentIndex === questions.length - 1 ? (
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.9}
            style={{
              flex: 2,
              paddingVertical: 16,
              borderRadius: 8,
              alignItems: "center",
              backgroundColor: COLORS.primary,
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: "700",
              }}
            >
              Natiijada Hel →
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() =>
              animateTransition("next", () =>
                setCurrentIndex((i) => Math.min(i + 1, questions.length - 1))
              )
            }
            activeOpacity={0.9}
            style={{
              flex: 2,
              paddingVertical: 16,
              borderRadius: 8,
              alignItems: "center",
              backgroundColor: isAnswered ? COLORS.primary : COLORS.card,
              borderWidth: isAnswered ? 0 : 1,
              borderColor: COLORS.border,
            }}
          >
            <Text
              style={{
                color: isAnswered ? "#FFFFFF" : COLORS.text,
                fontSize: 15,
                fontWeight: "600",
              }}
            >
              Xiga →
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
