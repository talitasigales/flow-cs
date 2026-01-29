import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function usePasswordCheck() {
  const { user } = useAuth();
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkPassword() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("password_changed")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data && data.password_changed === false) {
          setNeedsPasswordChange(true);
        }
      } catch (error) {
        console.error("Error checking password status:", error);
      } finally {
        setLoading(false);
      }
    }

    checkPassword();
  }, [user]);

  const markPasswordChanged = () => {
    setNeedsPasswordChange(false);
  };

  const refetch = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("password_changed")
      .eq("user_id", user.id)
      .maybeSingle();

    setNeedsPasswordChange(data?.password_changed === false);
  };

  return { needsPasswordChange, loading, refetch, markPasswordChanged };
}
