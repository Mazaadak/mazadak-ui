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
    