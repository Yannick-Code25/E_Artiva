import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { Stack } from "expo-router";
import { useAuth } from "../context/AuthContext";
import Colors from "../constants/Colors";

interface OrderItem {
  itemId?: string | number;
  item_name: string;
  quantity: number;
  unit_price: string | number;
  productImageUrl?: string;
}

interface Order {
  orderId: string | number;
  order_number?: string;
  status: string;
  total: string | number;
  currency: string;
  createdAt: string;
  products: OrderItem[];
}

const API_BASE_URL = "http://192.168.11.105:3001/api";

export default function OrdersScreen() {
  const { userToken, effectiveAppColorScheme } = useAuth();
  const colors = Colors[effectiveAppColorScheme ?? "light"];

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!userToken) {
      setError("Token utilisateur manquant, veuillez vous reconnecter");
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || `Erreur HTTP ${response.status}`);
      }
      setOrders(data);
    } catch (err: any) {
      console.log("Erreur API commandes:", err);
      setError(err.message || "Impossible de charger les commandes.");
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userToken]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Date invalide"
      : date.toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: { color: colors.text },
          headerTintColor: colors.primary,
        }}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >

        {error ? (
          <Text style={[styles.errorText, { color: colors.errorText }]}>
            {error}
          </Text>
        ) : orders.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.subtleText }]}>
            Vous n'avez aucune commande pour le moment.
          </Text>
        ) : (
          orders.map((order) => (
            <View
              key={order.orderId}
              style={[
                styles.orderCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              {/* Header */}
              <View style={styles.orderHeader}>
                <Text style={[styles.orderNumber, { color: colors.primary }]}>
                  CDE #{order.order_number || order.orderId}
                </Text>
              </View>
              <Text style={[styles.orderDate, { color: colors.subtleText }]}>
                {formatDate(order.createdAt)}
              </Text>

              {/* Produits */}
              <View style={styles.productsList}>
                {order.products.map((item, idx) => (
                  <View key={item.itemId || idx} style={styles.productRow}>
                    {item.productImageUrl ? (
                      <Image
                        source={{ uri: item.productImageUrl }}
                        style={styles.productImage}
                      />
                    ) : (
                      <View style={[styles.productImage, { backgroundColor: colors.inputBackground }]} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.productName, { color: colors.text }]}>
                        {item.item_name || item.item_name}
                      </Text>
                      <Text style={[styles.productDetails, { color: colors.subtleText }]}>
                        Qté {item.quantity} • {item.unit_price} {order.currency}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Footer */}
              <View style={styles.orderFooter}>
                <Text style={[styles.totalText, { color: colors.tint_price }]}>
                  Total : {order.total} {order.currency}
                </Text>
                <Text style={[styles.statusText, { color: colors.successText }]}>
                  {order.status}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { padding: 16, paddingBottom: Platform.OS === "ios" ? 30 : 20 },

  pageTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },

  orderCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },

  orderHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  orderNumber: { fontWeight: "bold", fontSize: 16 },
  orderDate: { fontSize: 13, marginBottom: 8, flexWrap: "wrap" },

  productsList: { marginTop: 8 },
  productRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  productImage: { width: 48, height: 48, borderRadius: 6, marginRight: 12 },
  productName: { fontSize: 15, fontWeight: "600" },
  productDetails: { fontSize: 13, marginTop: 2 },

  orderFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  totalText: { fontSize: 16, fontWeight: "bold" },
  statusText: { fontSize: 14, fontWeight: "600" },

  emptyText: { textAlign: "center", fontSize: 16, marginTop: 50 },
  errorText: { textAlign: "center", fontSize: 15, marginTop: 30 },
});
