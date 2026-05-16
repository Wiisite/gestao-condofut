import { useQuery } from "@tanstack/react-query";

interface AdminUser {
  id: number;
  nome: string;
  email: string;
  papel: string;
}

export function useAdminAuth() {
  const { data: user, isLoading, error } = useQuery<AdminUser>({
    queryKey: ["/api/admin/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    error,
  };
}