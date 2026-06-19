"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { createClient } from "../utils/supabase/client";

interface CheeseContextType {
  cheeseBalance: number;
  addCheese: (amount: number) => Promise<boolean>;
  spendCheese: (amount: number) => Promise<boolean>;
  isLoading: boolean;
}

const CheeseContext = createContext<CheeseContextType>({
  cheeseBalance: 0,
  addCheese: async () => false,
  spendCheese: async () => false,
  isLoading: true,
});

export function CheeseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cheeseBalance, setCheeseBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) {
        setCheeseBalance(0);
        setIsLoading(false);
        return;
      }
      
      try {
        // DB에서 프로필 정보(치즈 잔액) 조회
        const { data, error } = await supabase
          .from('profiles')
          .select('cheese_balance')
          .eq('id', user.id)
          .maybeSingle(); // maybeSingle을 써서 데이터 없어도 터지지 않게 함

        if (error) {
          // 권한 오류 시 로컬스토리지 fallback 사용
          console.warn("DB에서 치즈 잔액을 가져오지 못했습니다. 로컬 스토리지를 사용합니다.", error.message);
          const localBalance = localStorage.getItem(`cheese_${user.id}`);
          if (localBalance) {
            setCheeseBalance(parseInt(localBalance, 10));
          } else {
            setCheeseBalance(5);
            localStorage.setItem(`cheese_${user.id}`, "5");
          }
        } else if (!data) {
          // 데이터가 없으면 새 행을 insert (기본값 5)
          await supabase.from('profiles').insert({ id: user.id, cheese_balance: 5 });
          setCheeseBalance(5);
        } else {
          setCheeseBalance(data.cheese_balance);
        }
      } catch (err) {
        console.error("fetchBalance 에러", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [user, supabase]);

  const addCheese = async (amount: number) => {
    if (!user) return false;
    
    try {
      // 1. 최신 잔액 조회
      const { data, error: fetchErr } = await supabase
        .from('profiles')
        .select('cheese_balance')
        .eq('id', user.id)
        .single();
        
      const currentBalance = data?.cheese_balance || 0;
      const newBalance = currentBalance + amount;
      
      // 2. DB 업데이트
      const { error } = await supabase
        .from('profiles')
        .update({ cheese_balance: newBalance })
        .eq('id', user.id);
        
      if (error) {
        localStorage.setItem(`cheese_${user.id}`, newBalance.toString());
      }
      setCheeseBalance(newBalance);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const spendCheese = async (amount: number) => {
    if (!user) return false;
    
    try {
      // 1. 최신 잔액 조회
      const { data, error: fetchErr } = await supabase
        .from('profiles')
        .select('cheese_balance')
        .eq('id', user.id)
        .single();
        
      const currentBalance = data?.cheese_balance || 0;
      if (currentBalance < amount) return false;
      
      const newBalance = currentBalance - amount;
      
      // 2. DB 업데이트
      const { error } = await supabase
        .from('profiles')
        .update({ cheese_balance: newBalance })
        .eq('id', user.id);
        
      if (error) {
        localStorage.setItem(`cheese_${user.id}`, newBalance.toString());
      }
      setCheeseBalance(newBalance);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  return (
    <CheeseContext.Provider value={{ cheeseBalance, addCheese, spendCheese, isLoading }}>
      {children}
    </CheeseContext.Provider>
  );
}

export const useCheese = () => {
  const context = useContext(CheeseContext);
  if (context === undefined) {
    throw new Error("useCheese must be used within a CheeseProvider");
  }
  return context;
};
