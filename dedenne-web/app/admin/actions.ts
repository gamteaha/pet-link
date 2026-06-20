"use server";

import { createClient } from "@supabase/supabase-js";

// Helper to get admin client
const getAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export async function getAdminOrders(statusFilter: string, startDate: string, endDate: string, searchQuery: string) {
  const supabase = getAdminClient();
  let query = supabase.from("orders").select("*").order("ordered_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }
  if (startDate) {
    query = query.gte("ordered_at", new Date(startDate).toISOString());
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    query = query.lte("ordered_at", end.toISOString());
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const userIds = Array.from(new Set(data.map(o => o.user_id).filter(Boolean)));
  let profileMap: Record<string, any> = {};
  
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, email")
      .in("id", userIds);
      
    if (profiles) {
      profiles.forEach(p => {
        profileMap[p.id] = p;
      });
    }
  }

  const ordersWithProfiles = data.map(o => ({
    ...o,
    total_price: o.total_price < 1000 ? o.total_price * 1000 : o.total_price,
    profiles: profileMap[o.user_id] || null
  }));

  let filteredData = ordersWithProfiles;
  if (searchQuery.trim() !== "") {
    const lowerQ = searchQuery.toLowerCase();
    filteredData = ordersWithProfiles.filter((o) => {
      const name = (o.profiles?.display_name || "").toLowerCase();
      const email = (o.profiles?.email || "").toLowerCase();
      return name.includes(lowerQ) || email.includes(lowerQ) || o.user_id?.toLowerCase().includes(lowerQ);
    });
  }

  return filteredData;
}

export async function getOrderItems(orderId: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("order_items")
    .select(`
      *,
      items (
        category,
        emoji
      )
    `)
    .eq("order_id", orderId);
    
  return data || [];
}

export async function updateOrderStatus(orderId: string, userId: string, newStatus: string) {
  const supabase = getAdminClient();
  
  // 1. 상태 업데이트
  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId);

  if (updateError) throw updateError;

  // 2. 인벤토리 롤백/복구
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("item_id")
    .eq("order_id", orderId);

  if (orderItems && orderItems.length > 0) {
    const quantityChange = newStatus === "cancelled" ? -10 : 10;

    for (const oi of orderItems) {
      const { data: currentInv } = await supabase
        .from("user_inventory")
        .select("quantity")
        .eq("user_id", userId)
        .eq("item_id", oi.item_id)
        .single();
        
      const currentQty = currentInv?.quantity || 0;
      const newQty = Math.max(0, currentQty + quantityChange);

      await supabase.from("user_inventory").upsert({
        user_id: userId,
        item_id: oi.item_id,
        quantity: newQty,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id, item_id" });
    }
  }

  return true;
}

export async function getAdminStats() {
  const supabase = getAdminClient();
  
  const { data: orders } = await supabase
    .from("orders")
    .select("ordered_at, total_price")
    .eq("status", "completed");

  const { data: orderItems } = await supabase
    .from("order_items")
    .select(`
      item_id,
      item_name,
      price,
      orders!inner(status),
      items(category)
    `)
    .eq("orders.status", "completed");

  return {
    orders: orders || [],
    orderItems: orderItems || []
  };
}
