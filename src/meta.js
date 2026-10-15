import { useEffect, useState } from 'react';
import api from './api';
let cache;
export function useMeta() {
  const [m, setM] = useState(cache);
  useEffect(() => { if (!cache) api.get('/meta').then((r) => { cache = r.data; setM(cache); }); }, []);
  return m;
}
export const currentYear = () => {
  const d = new Date(), y = d.getMonth() >= 5 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, '0')}`;
};
