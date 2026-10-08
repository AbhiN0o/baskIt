import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useAuthUser from './useAuthUser';
import { addFavorite, removeFavorite } from '../lib/api';
import { errMsg } from '../lib/errors';

// Real, server-backed wishlist. The saved ids ride along on the authUser
// query, so every heart on every page stays in sync automatically.
export default function useFavorites() {
  const { authUser, type } = useAuthUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const ids = new Set((type === 'user' ? authUser?.favorites : []) || []);

  const { mutate, isPending } = useMutation({
    mutationFn: ({ productId, saved }) => (saved ? removeFavorite(productId) : addFavorite(productId)),
    onSuccess: (_, { saved }) => {
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success(saved ? 'Removed from saved' : 'Saved for later');
    },
    onError: (e) => toast.error(errMsg(e, 'Could not update saved items')),
  });

  const toggle = (productId) => {
    if (!authUser) { toast('Log in to save products'); navigate('/user/login'); return; }
    if (type !== 'user') { toast('Saving products is for buyer accounts'); return; }
    mutate({ productId, saved: ids.has(productId) });
  };

  return { isFavorite: (id) => ids.has(id), toggle, isPending };
}
