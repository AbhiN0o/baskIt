import { useQuery } from '@tanstack/react-query';
import { getAuthUser } from '../lib/api';

const useAuthUser = () => {
  const { data, isLoading, refetch  } = useQuery({
    queryKey: ['authUser'],
    queryFn: getAuthUser,
    retry: false,
  });
  return { isLoading, authUser: data?.user ,type:data?.type, refetch};
};

export default useAuthUser;
