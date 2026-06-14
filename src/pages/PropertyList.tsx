import { useMemo } from 'react';

interface PropertyListProps {
  onLogout: () => void;
}

const PropertyList = ({ onLogout }: PropertyListProps) => {
  const properties = useMemo(
    () => [
      { id: 1, name: '恵比寿グリーンハイツ', rent: '120,000円', area: '渋谷区' },
      { id: 2, name: '麻布十番レジデンス', rent: '220,000円', area: '港区' },
      { id: 3, name: '吉祥寺ファミリーホーム', rent: '98,000円', area: '武蔵野市' },
    ],
    [],
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>物件一覧</h1>
        <button onClick={onLogout}>ログアウト</button>
      </div>
      <div className="property-grid">
        {properties.map((property) => (
          <div key={property.id} className="property-card">
            <h3>{property.name}</h3>
            <p>家賃: {property.rent}</p>
            <p>エリア: {property.area}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyList;
