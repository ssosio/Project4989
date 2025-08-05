import { useEffect, useState, useRef } from 'react';
import useKakaoLoader from './useKakaoLoader.jsx';

const MapComponent = () => {
    const isKakaoLoaded = useKakaoLoader();
    const [map, setMap] = useState(null);
    const [address, setAddress] = useState('');
    const [places, setPlaces] = useState([]);
    const [selectedCoords, setSelectedCoords] = useState(null);

    const debounceTimeout = useRef(null);

    useEffect(() => {
        if (!isKakaoLoaded) return;

        const kakao = window.kakao;
        const container = document.getElementById('map');
        const options = {
            center: new kakao.maps.LatLng(37.5665, 126.9780),
            level: 3,
        };

        const createdMap = new kakao.maps.Map(container, options);
        setMap(createdMap);
    }, [isKakaoLoaded]);

    const handleKeywordSearch = (keyword) => {
        if (!map || !keyword) {
            setPlaces([]);
            return;
        }
        const kakao = window.kakao;
        const ps = new kakao.maps.services.Places();

        ps.keywordSearch(keyword, function (data, status) {
            if (status === kakao.maps.services.Status.OK) {
                setPlaces(data);
            } else {
                setPlaces([]);
            }
        });
    };

    // 1. input 변화 감지
    const handleInputChange = (e) => {
        setAddress(e.target.value);
    };

    // 2. address 바뀔 때마다 디바운스 후 자동검색 실행
    useEffect(() => {
        if (!map) return; // map 준비 안 됐으면 무시
        if (!address) {
            setPlaces([]);
            return;
        }

        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            handleKeywordSearch(address);
        }, 400);

        // cleanup 함수로 타임아웃 클리어
        return () => clearTimeout(debounceTimeout.current);
    }, [address, map]);

    const handlePlaceClick = (place) => {
        if (!map) return;

        const kakao = window.kakao;
        const coords = new kakao.maps.LatLng(place.y, place.x);

        new kakao.maps.Marker({
            map: map,
            position: coords,
        });

        map.setCenter(coords);
        setSelectedCoords({ lat: place.y, lng: place.x });
    };

    if (!isKakaoLoaded) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '500px',
                    fontSize: '18px',
                    color: '#666',
                }}
            >
                지도를 불러오는 중...
            </div>
        );
    }

    return (
        <div>
            <input
                type="text"
                value={address}
                onChange={handleInputChange}
                placeholder="주소를 입력하세요"
                style={{ marginRight: '10px' }}
            />
            {/* 검색 버튼 필요 없으면 지워도 됨 */}
            <button onClick={() => handleKeywordSearch(address)}>검색</button>

            <div
                style={{
                    border: '1px solid #ccc',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    marginTop: '5px',
                    width: '300px',
                    background: '#fff',
                    position: 'absolute',
                    zIndex: 999,
                }}
            >
                {places.map((place) => (
                    <div
                        key={place.id}
                        style={{
                            padding: '8px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #eee',
                        }}
                        onClick={() => handlePlaceClick(place)}
                    >
                        {place.place_name}
                    </div>
                ))}
            </div>

            <div
                id="map"
                style={{
                    width: '100%',
                    height: '500px',
                    marginTop: '20px',
                }}
            ></div>

            {selectedCoords && (
                <div style={{ marginTop: '20px', fontSize: '16px' }}>
                    <strong>선택한 좌표값:</strong>
                    <br />
                    위도 (lat): {selectedCoords.lat}
                    <br />
                    경도 (lng): {selectedCoords.lng}
                </div>
            )}
        </div>
    );
};

export default MapComponent;
