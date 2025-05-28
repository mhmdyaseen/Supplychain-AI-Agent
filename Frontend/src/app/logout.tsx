import { useRouter } from 'next/navigation';

export default function useLogout() {
  const router = useRouter();

  return () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userID');
    localStorage.removeItem('role');


    router.push('/');
  };
}