import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { adminStats, adminUsers, adminAssessments, removeToken, removeUser } from "../api";

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

export default function AdminScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, assessmentsRes] = await Promise.all([
        adminStats(),
        adminUsers(),
        adminAssessments(),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setAssessments(assessmentsRes.data);
    } catch (err) {
      console.log("Admin fetch error:", err);
      // If 403 or 401, they shouldn't be here
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await removeToken();
    await removeUser();
    navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
  };

  const renderTabButton = (title, icon) => {
    const isActive = activeTab === title;
    return (
      <TouchableOpacity
        onPress={() => setActiveTab(title)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: isActive ? COLORS.primary : COLORS.card,
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 8,
          marginRight: 8,
          borderWidth: 1,
          borderColor: isActive ? COLORS.primary : COLORS.border,
        }}
      >
        <Text style={{ fontSize: 16, marginRight: 6 }}>{icon}</Text>
        <Text
          style={{
            color: isActive ? "#FFFFFF" : COLORS.text,
            fontWeight: "700",
          }}
        >
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderDashboard = () => {
    if (!stats) return null;
    return (
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{ color: COLORS.text, fontSize: 22, fontWeight: "800", marginBottom: 20 }}
        >
          Warbixinta Guud
        </Text>

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: COLORS.card,
              padding: 20,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
              marginRight: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 24 }}>👥</Text>
            <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: "800", marginTop: 8 }}>
              {stats.total_users}
            </Text>
            <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 4, fontWeight: "600" }}>Isticmaalayaal</Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: COLORS.card,
              padding: 20,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
              marginLeft: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 24 }}>📝</Text>
            <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: "800", marginTop: 8 }}>
              {stats.total_assessments}
            </Text>
            <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 4, fontWeight: "600" }}>Tijaabooyin</Text>
          </View>
        </View>

        {/* Risk Distribution */}
        <View
          style={{
            backgroundColor: COLORS.card,
            padding: 20,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: "700", marginBottom: 16 }}>
            Heerka Khatarta (Risk Level)
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={{ color: COLORS.danger, fontWeight: "800", fontSize: 20, marginBottom: 4 }}>
                {stats.risk_distribution?.High || 0}
              </Text>
              <Text style={{ color: COLORS.textMuted, fontSize: 13, fontWeight: "600" }}>Sare</Text>
            </View>
            <View style={{ alignItems: "center", flex: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: COLORS.border }}>
              <Text style={{ color: COLORS.warning, fontWeight: "800", fontSize: 20, marginBottom: 4 }}>
                {stats.risk_distribution?.Medium || 0}
              </Text>
              <Text style={{ color: COLORS.textMuted, fontSize: 13, fontWeight: "600" }}>Dhexe</Text>
            </View>
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={{ color: COLORS.success, fontWeight: "800", fontSize: 20, marginBottom: 4 }}>
                {stats.risk_distribution?.Low || 0}
              </Text>
              <Text style={{ color: COLORS.textMuted, fontSize: 13, fontWeight: "600" }}>Hoose</Text>
            </View>
          </View>
        </View>

        {/* Condition Distribution */}
        <View
          style={{
            backgroundColor: COLORS.card,
            padding: 20,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: "700", marginBottom: 16 }}>
            Noocyada Cudurrada
          </Text>
          {Object.entries(stats.condition_distribution || {}).map(([cond, count], i, arr) => (
            <View key={cond} style={{ 
              flexDirection: "row", 
              justifyContent: "space-between", 
              alignItems: "center", 
              paddingVertical: 12,
              borderBottomWidth: i === arr.length - 1 ? 0 : 1,
              borderBottomColor: COLORS.border
            }}>
              <Text style={{ color: COLORS.text, fontSize: 15, fontWeight: "600" }}>{cond}</Text>
              <Text style={{ color: COLORS.primary, fontWeight: "800", fontSize: 16 }}>{count}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderUsers = () => (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: "800", marginBottom: 20 }}>
          Dhammaan Isticmaalayaasha
        </Text>
      }
      renderItem={({ item }) => (
        <View
          style={{
            backgroundColor: COLORS.card,
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
            marginBottom: 12,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              backgroundColor: COLORS.bg,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
              borderWidth: 1,
              borderColor: COLORS.border
            }}
          >
            <Text style={{ fontSize: 18 }}>{item.is_admin ? "👑" : "👤"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: COLORS.text, fontWeight: "700", fontSize: 16, marginBottom: 2 }}>
              {item.name || "Bilaa Magac"}
            </Text>
            <Text style={{ color: COLORS.textMuted, fontSize: 13, fontWeight: "500" }}>{item.email}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: COLORS.textMuted, fontSize: 11, marginBottom: 4, fontWeight: "600" }}>Tijaabooyin</Text>
            <Text style={{ color: COLORS.primary, fontWeight: "800", fontSize: 16 }}>{item.assessment_count}</Text>
          </View>
        </View>
      )}
    />
  );

  const renderAssessments = () => (
    <FlatList
      data={assessments}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: "800", marginBottom: 20 }}>
          Tijaabooyinkii U Dambeeyay
        </Text>
      }
      renderItem={({ item }) => {
        const riskColor = item.risk_level === "High" ? COLORS.danger : item.risk_level === "Medium" ? COLORS.warning : COLORS.success;
        return (
          <View
            style={{
              backgroundColor: COLORS.card,
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.text, fontWeight: "700", fontSize: 16 }}>
                  {item.predicted_condition}
                </Text>
                <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 4, fontWeight: "500" }}>
                  {item.user_name || "Guest"} ({item.user_email})
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: COLORS.card,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  alignSelf: "flex-start",
                  borderWidth: 1,
                  borderColor: riskColor,
                }}
              >
                <Text style={{ color: riskColor, fontSize: 12, fontWeight: "800" }}>
                  {item.risk_level} Risk
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 }}>
              <Text style={{ color: COLORS.textMuted, fontSize: 12, flex: 1, fontWeight: "600" }}>
                Date: {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Unknown"}
              </Text>
              <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: "700" }}>
                Score: {Math.round((item.confidence_score || 0) * 100)}%
              </Text>
            </View>
          </View>
        );
      }}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      {/* Header */}
      <View
        style={{
          paddingTop: 56,
          paddingHorizontal: 24,
          paddingBottom: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          backgroundColor: COLORS.card,
          zIndex: 10,
        }}
      >
        <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: "800" }}>
          Admin Panel
        </Text>
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: COLORS.card,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text style={{ color: COLORS.text, fontWeight: "700" }}>Bax</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={{ paddingHorizontal: 24, paddingTop: 16, flexDirection: "row" }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderTabButton("Dashboard", "📊")}
          {renderTabButton("Users", "👥")}
          {renderTabButton("Assessments", "📝")}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            {activeTab === "Dashboard" && renderDashboard()}
            {activeTab === "Users" && renderUsers()}
            {activeTab === "Assessments" && renderAssessments()}
          </>
        )}
      </View>
    </View>
  );
}
