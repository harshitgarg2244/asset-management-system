import { useEffect, useState } from 'react';
import { Laptop2, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import Layout from '../components/Layout';
import TagChip from '../components/TagChip';

const MyAssets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyAssets = async () => {
      try {
        const { data } = await api.get('/assets/my-assets');
        setAssets(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyAssets();
  }, []);

  return (
    <Layout eyebrow="Self-Service" title="My Assets" subtitle="Hardware & software currently assigned to you.">
      {loading ? (
        <p className="text-slate-500 text-sm">Loading...</p>
      ) : assets.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center animate-fadeInUp">
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3"><Laptop2 size={20} /></div>
          <p className="text-slate-500 text-sm">No assets are currently assigned to you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {assets.map((asset, i) => (
            <div key={asset._id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fadeInUp" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"><Laptop2 size={16} /></div>
                <TagChip>{asset.assetTag}</TagChip>
              </div>
              <h3 className="font-display font-semibold text-slate-900">{asset.name}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{asset.category}</p>
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                {asset.serialNumber && <p className="text-xs text-slate-400 font-mono">S/N {asset.serialNumber}</p>}
                {asset.warrantyExpiry && <p className="text-xs text-slate-400 flex items-center gap-1.5"><ShieldCheck size={12} />Warranty until {new Date(asset.warrantyExpiry).toLocaleDateString()}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default MyAssets;
