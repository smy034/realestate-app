import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

interface Property {
  id: number;
  name: string;
  rent: number;
  area: string;
  layout: string;
  user_id?: string;
}

interface PropertyListProps {
  session: any;
  onLogout: () => void;
}

const PropertyList = ({ session, onLogout }: PropertyListProps) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const isAdmin = session?.user?.email?.toLowerCase() === 'kanri@exsmpie.com';
  const [name, setName] = useState('');
  const [rent, setRent] = useState('');
  const [area, setArea] = useState('');
  const [layout, setLayout] = useState('');
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const userId = session?.user?.id;

  const loadProperties = async () => {
    setMessage('');
    let query = supabase
      .from('properties')
      .select('id, name, rent, area, layout, user_id');

    if (!isAdmin) {
      query = query.eq('user_id', userId ?? '');
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      setMessage(`物件の取得に失敗しました: ${error.message}`);
      return;
    }

    setProperties(data ?? []);
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const resetForm = () => {
    setName('');
    setRent('');
    setArea('');
    setLayout('');
    setEditingProperty(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    if (!name || !rent || !area || !layout) {
      setMessage('すべての項目を入力してください。');
      return;
    }

    setLoading(true);

    if (editingProperty) {
      const { error } = await supabase
        .from('properties')
        .update({ name, rent: Number(rent), area, layout })
        .eq('id', editingProperty.id);

      if (error) {
        setMessage(`更新に失敗しました: ${error.message}`);
      } else {
        setMessage('物件を更新しました。');
        resetForm();
        await loadProperties();
      }
    } else {
      const { error } = await supabase.from('properties').insert([
        {
          user_id: userId,
          name,
          rent: Number(rent),
          area,
          layout,
        },
      ]);

      if (error) {
        setMessage(`登録に失敗しました: ${error.message}`);
      } else {
        setMessage('新しい物件を登録しました。');
        resetForm();
        await loadProperties();
      }
    }

    setLoading(false);
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setName(property.name);
    setRent(String(property.rent));
    setArea(property.area);
    setLayout(property.layout);
    setMessage('編集モードです。変更を保存してください。');
  };

  const handleDelete = async (propertyId: number) => {
    setMessage('');
    setLoading(true);
    const { error } = await supabase.from('properties').delete().eq('id', propertyId);

    if (error) {
      setMessage(`削除に失敗しました: ${error.message}`);
    } else {
      setMessage('物件を削除しました。');
      await loadProperties();
    }

    setLoading(false);
  };

  // 管理者用：物件データをCSVでダウンロードする
  const downloadAsCSV = () => {
    // CSVのヘッダー
    const headers = ['物件名', '家賃（円）', 'エリア', '間取り', 'ユーザーID'];
    
    // 物件データの行を作成
    const rows = properties.map((property) => [
      property.name,
      property.rent,
      property.area,
      property.layout,
      property.user_id || '',
    ]);
    
    // ヘッダーとデータをマージしてCSV形式の文字列に変換
    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            // セル内にカンマやダブルクォートが含まれる場合に対応
            const cellStr = String(cell);
            return `"${cellStr.replace(/"/g, '""')}"`;
          })
          .join(',')
      )
      .join('\n');
    
    // BOMをUTF-8に対応させるため、先頭にEFBBBFを追加（Excelで文字化けを防ぐ）
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // ダウンロード処理
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `properties_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    // メモリ解放
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>物件管理</h1>
        <button onClick={onLogout}>ログアウト</button>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h2>{editingProperty ? '物件を編集する' : '新しい物件を登録する'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">物件名</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="rent">家賃（円）</label>
            <input
              id="rent"
              type="number"
              min="0"
              value={rent}
              onChange={(e) => setRent(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="area">エリア名</label>
            <input
              id="area"
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="layout">間取り</label>
            <input
              id="layout"
              type="text"
              value={layout}
              onChange={(e) => setLayout(e.target.value)}
              required
            />
          </div>
          {message && <p style={{ color: message.includes('失敗') ? 'red' : 'green' }}>{message}</p>}
          <button type="submit" disabled={loading}>
            {loading ? '保存中...' : editingProperty ? '更新する' : '登録する'}
          </button>
          {editingProperty && (
            <button
              type="button"
              style={{ marginLeft: '12px', background: '#6b7280' }}
              onClick={resetForm}
            >
              キャンセル
            </button>
          )}
        </form>
      </div>

      <h2 style={{ marginTop: '28px' }}>物件一覧</h2>
      {isAdmin && (
        <div style={{ marginBottom: '20px' }}>
          <button
            type="button"
            style={{ background: '#059669' }}
            onClick={downloadAsCSV}
          >
            CSVダウンロード
          </button>
        </div>
      )}
      <div className="property-grid">
        {properties.map((property) => (
          <div key={property.id} className="property-card">
            <h3>{property.name}</h3>
            <p>家賃: {property.rent.toLocaleString()}円</p>
            <p>エリア: {property.area}</p>
            <p>間取り: {property.layout}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px' }}>
              <button type="button" onClick={() => handleEdit(property)}>
                編集
              </button>
              <button
                type="button"
                style={{ background: '#dc2626' }}
                onClick={() => handleDelete(property.id)}
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyList;
