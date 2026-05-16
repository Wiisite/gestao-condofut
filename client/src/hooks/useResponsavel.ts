import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ResponsavelWithAlunos } from "@shared/schema";

export function useResponsavel() {
  const { data: responsavel, isLoading, error } = useQuery<ResponsavelWithAlunos | null>({
    queryKey: ["/api/responsaveis/me"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    responsavel,
    isLoading,
    isAuthenticated: !!responsavel && !error,
    error,
  };
}

export async function logoutResponsavel() {
  try {
    await apiRequest("POST", "/api/responsavel/logout");
    // Force reload to clear any cached data
    window.location.href = "/responsavel/login";
  } catch (error) {
    console.error("Logout error:", error);
    // Even if logout fails, redirect to login
    window.location.href = "/responsavel/login";
  }
}