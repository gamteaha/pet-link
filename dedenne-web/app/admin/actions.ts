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

  const ordersWithProfiles = data.map(o => {
    const isRealMoney = o.total_price >= 1000;
    return {
      ...o,
      isRealMoney,
      cheese_amount: isRealMoney ? o.total_items : o.total_price,
      krw_amount: isRealMoney ? o.total_price : 0,
      profiles: profileMap[o.user_id] || null
    };
  });

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
    .select("*")
    .eq("order_id", orderId);
    
  if (!data) return [];

  const itemIds = Array.from(new Set(data.map(oi => oi.item_id).filter(Boolean)));
  let itemsMap: Record<string, any> = {};
  
  if (itemIds.length > 0) {
    const { data: itemsData } = await supabase
      .from("items")
      .select("id, category, emoji")
      .in("id", itemIds);
      
    if (itemsData) {
      itemsData.forEach(item => itemsMap[item.id] = item);
    }
  }

  return data.map(oi => ({
    ...oi,
    items: itemsMap[oi.item_id] || null
  }));
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

export async function getAdminDashboardMetrics() {
  const supabase = getAdminClient();

  // 1. 전체 유저 수
  const { count: usersCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // 2. 총 누적 매출 (진짜 돈, total_price >= 1000)
  const { data: totalRevData } = await supabase
    .from("orders")
    .select("total_price")
    .eq("status", "completed")
    .gte("total_price", 1000);
  
  const totalRevenue = totalRevData?.reduce((sum, row) => sum + (row.total_price || 0), 0) || 0;

  // 3. 이번 달 총 매출 (진짜 돈, total_price >= 1000)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const { data: revenueData } = await supabase
    .from("orders")
    .select("total_price")
    .eq("status", "completed")
    .gte("total_price", 1000)
    .gte("ordered_at", firstDayOfMonth.toISOString());
  
  const monthRevenue = revenueData?.reduce((sum, row) => sum + (row.total_price || 0), 0) || 0;

  return {
    totalUsers: usersCount || 0,
    monthRevenue,
    totalRevenue,
  };
}

export async function getAdminStats() {
  const supabase = getAdminClient();
  
  const { data: orders } = await supabase
    .from("orders")
    .select("ordered_at, total_price")
    .eq("status", "completed")
    .gte("total_price", 1000); // 정산 및 매출 현황 그래프는 실제 매출(원화) 기준

  // 카테고리/Top10은 치즈로 구매한 아이템 내역 (total_price < 1000 혹은 order_items 조인)
  const { data: orderItems } = await supabase
    .from("order_items")
    .select(`
      item_id,
      item_name,
      price,
      orders!inner(status)
    `)
    .eq("orders.status", "completed");

  if (!orderItems) {
    return { orders: orders || [], orderItems: [] };
  }

  // Fetch items manually since there's no FK relationship between order_items and items
  const itemIds = Array.from(new Set(orderItems.map(oi => oi.item_id).filter(Boolean)));
  const { data: itemsData } = await supabase
    .from("items")
    .select("id, category")
    .in("id", itemIds);

  const itemsMap: Record<string, any> = {};
  if (itemsData) {
    itemsData.forEach(item => itemsMap[item.id] = item);
  }

  const enrichedOrderItems = orderItems.map(oi => ({
    ...oi,
    items: itemsMap[oi.item_id] || { category: "unknown" }
  }));

  return {
    orders: orders || [],
    orderItems: enrichedOrderItems
  };
}

export async function getAdminLogsData() {
  const supabase = getAdminClient();
  const now = new Date();

  // 1. DB 연결 상태 체크
  let dbStatus: "ok" | "error" = "ok";
  try {
    const { error } = await supabase.from("profiles").select("id", { count: "exact", head: true });
    if (error) dbStatus = "error";
  } catch {
    dbStatus = "error";
  }

  // 2. 테이블별 row 수 조회 (pets 제외)
  const tables = ["profiles", "orders", "order_items", "items", "user_inventory", "cheese_logs"];
  
  const counts = await Promise.all(
    tables.map((table) => supabase.from(table).select("*", { count: "exact", head: true }).then(({ count }) => count))
  );

  const tableStats = counts.map((count, i) => count ?? 0);

  // 3. 최근 활동 타임라인 데이터 수집
  const allActivities: any[] = [];

  // 최근 가입 유저
  const { data: recentProfiles } = await supabase
    .from("profiles")
    .select("id, email, display_name, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  
  recentProfiles?.forEach((p) => {
    allActivities.push({
      type: "signup", icon: "👤", color: "bg-blue-100 text-blue-700",
      label: "신규 가입", detail: p.display_name || p.email || p.id.split("-")[0],
      time: p.created_at,
    });
  });

  // 최근 주문
  const { data: recentOrders } = await supabase
    .from("orders")
    .select("id, total_price, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  
  recentOrders?.forEach((o) => {
    allActivities.push({
      type: "order", icon: "💳", color: "bg-green-100 text-green-700",
      label: o.status === "completed" ? "결제 완료" : "주문 취소",
      detail: `₩/🧀 ${o.total_price} (주문 #${o.id.split("-")[0]})`,
      time: o.created_at,
    });
  });

  // 최근 치즈 변동
  const { data: recentCheese } = await supabase
    .from("cheese_logs")
    .select("id, change_type, amount, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  
  recentCheese?.forEach((c) => {
    allActivities.push({
      type: "cheese", icon: "🧀", color: "bg-amber-100 text-amber-700",
      label: `치즈 ${c.change_type}`,
      detail: `${c.amount > 0 ? "+" : ""}${c.amount} (${c.reason || "-"})`,
      time: c.created_at,
    });
  });

  // 전체 최신순 정렬
  allActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return {
    dbStatus,
    tableStats,
    activities: allActivities.slice(0, 30)
  };
}

export async function getAdminUsers(searchQuery: string) {
  const supabase = getAdminClient();

  // 1. 프로필 가져오기
  let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });
  
  if (searchQuery.trim() !== "") {
    query = query.ilike("display_name", `%${searchQuery}%`);
  }
  
  const { data: profiles, error } = await query;
  if (error || !profiles) return [];

  const userIds = profiles.map(p => p.id);
  
  const { data: orders } = await supabase
    .from("orders")
    .select("user_id, total_price, status")
    .in("user_id", userIds)
    .eq("status", "completed");

  const { data: userPets } = await supabase
    .from("user_pets")
    .select("user_id, config")
    .in("user_id", userIds);

  const { data: cheeseLogs } = await supabase
    .from("cheese_logs")
    .select("user_id")
    .in("user_id", userIds)
    .eq("change_type", "spend");

  let finalUsers = profiles.map(profile => {
    const userOrders = orders?.filter(o => o.user_id === profile.id) || [];
    const krwOrders = userOrders.filter(o => (o.total_price || 0) >= 1000);
    const totalSpent = krwOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);

    const spendCount = cheeseLogs?.filter(l => l.user_id === profile.id).length || 0;

    const userPet = userPets?.find(p => p.user_id === profile.id);
    const mainPet = userPet?.config?.shopId || userPet?.config?.species || "dedenne";

    return {
      ...profile,
      main_pet: mainPet,
      order_count: spendCount,
      total_spent: totalSpent
    };
  });

  if (searchQuery.trim() !== "") {
    const lowerQ = searchQuery.toLowerCase();
    finalUsers = finalUsers.filter(u => 
      (u.display_name || "").toLowerCase().includes(lowerQ) || 
      (u.email || "").toLowerCase().includes(lowerQ)
    );
  }

  return finalUsers;
}

export async function getAdminUserDetail(userId: string) {
  const supabase = getAdminClient();

  // 1. 인벤토리 목록 (FK to items missing, manual join)
  const { data: inventory } = await supabase
    .from("user_inventory")
    .select("*")
    .eq("user_id", userId);

  let enrichedInventory: any[] = [];
  if (inventory && inventory.length > 0) {
    const invItemIds = Array.from(new Set(inventory.map(i => i.item_id).filter(Boolean)));
    const { data: invItemsData } = await supabase
      .from("items")
      .select("id, name, category, emoji")
      .in("id", invItemIds);

    const invItemsMap: Record<string, any> = {};
    if (invItemsData) {
      invItemsData.forEach(item => invItemsMap[item.id] = item);
    }

    enrichedInventory = inventory.map(inv => ({
      ...inv,
      items: invItemsMap[inv.item_id] || null
    }));
  }

  // 2. 주문 내역 (현금 결제만 표시하도록 필터 추가)
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .gte("total_price", 1000)
    .order("created_at", { ascending: false });

  let enrichedOrders: any[] = [];
  if (orders && orders.length > 0) {
    const orderIds = orders.map(o => o.id);
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("*")
      .in("order_id", orderIds);

    let itemsMap: Record<string, any> = {};
    if (orderItems && orderItems.length > 0) {
      const itemIds = Array.from(new Set(orderItems.map(oi => oi.item_id).filter(Boolean)));
      if (itemIds.length > 0) {
        const { data: itemsData } = await supabase
          .from("items")
          .select("id, category, emoji")
          .in("id", itemIds);
        if (itemsData) {
          itemsData.forEach(item => itemsMap[item.id] = item);
        }
      }
    }

    enrichedOrders = orders.map(o => {
      const itemsForOrder = orderItems?.filter(oi => oi.order_id === o.id).map(oi => ({
        ...oi,
        items: itemsMap[oi.item_id] || null
      })) || [];
      return {
        ...o,
        order_items: itemsForOrder
      };
    });
  }

  // 3. 치즈 로그
  const { data: cheeseLogs } = await supabase
    .from("cheese_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return {
    inventory: enrichedInventory,
    orders: enrichedOrders,
    cheeseLogs: cheeseLogs || []
  };
}
