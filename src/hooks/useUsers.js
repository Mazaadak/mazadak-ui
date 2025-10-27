import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '../api/users';
import { queryKeys } from './queryKeys';

export const useUser = (userId) => {
  return useQuery({
    queryKey: queryKeys.users.user(userId),
    queryFn: () => usersAPI.getUser(userId),
    enabled: !!userId,
  })
};
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, updateData }) => usersAPI.updateUser(userId, updateData),
    onSuccess: (data, variables) => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: queryKeys.users.user(variables.userId) });
    },
  });
};
