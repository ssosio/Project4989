import { useEffect, useState, useRef } from 'react';
import useKakaoLoader from './useKakaoLoader.jsx';
import styled from 'styled-components';
import { Typography } from '@mui/material';

// 스타일 컴포넌트는 이전과 동일합니다.
const SearchContainer = styled.div`
  position: relative;
  width: 350px;
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
`;
const SearchInput = styled.input`
  flex-grow: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;
const SearchButton = styled.button`
  padding: 8px 16px;
  border: none;
  background-color: #007bff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  &:hover {
    background-color: #0056b3;
  }
`;
const ResultsContainer = styled.div`
  position: absolute;
  z-index: 999;
  background: white;
  border: 1px solid #ccc;
  width: calc(100% - 90px);
  max-height: 150px;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  top: 40px;
`;
const ResultItem = styled.div`
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  &:hover {
    background-color: #f0f0f0;
  }
  &:last-child {
    border-bottom: none;
  }
`;
const MapContainer = styled.div`
  width: 100%;
  height: 500px;
  position: relative;
  margin-top: 20px;
`;
const RadiusControl = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.8);
  padding: 10px;
  border-radius: 8px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;
const RadiusInput = styled.input`
  width: 200px;
  margin-top: 8px;
`;


const MapComponent = () => {
    const isKakaoLoaded = useKakaoLoader();
    const [map, setMap] = useState(null);
    const [circle, setCircle] = useState(null);
    const [radius, setRadius] = useState(1000);
    const [center, setCenter] = useState(null);
    const [address, setAddress] = useState('');
    const [places, setPlaces] = useState([]);
    const [marker, setMarker] = useState(null);

    // 1. 지도 초기화 (이전과 동일)
    useEffect(() => {
        if (!isKakaoLoaded) return;
        const kakao = window.kakao;
        const container = document.getElementById('map');
        const initialCenter = new kakao.maps.LatLng(37.5665, 126.9780);
        const options = { center: initialCenter, level: 3 };

        const createdMap = new kakao.maps.Map(container, options);
        setMap(createdMap);
        setCenter({ lat: initialCenter.getLat(), lng: initialCenter.getLng() });

        kakao.maps.event.addListener(createdMap, 'dragend', function () {
            const newCenter = createdMap.getCenter();
            setCenter({ lat: newCenter.getLat(), lng: newCenter.getLng() });
            setAddress('');
            setPlaces([]);
        });
    }, [isKakaoLoaded]);

    // 2. 지도 요소 업데이트 (이전과 동일)
    useEffect(() => {
        if (!map || !center) return;
        const kakao = window.kakao;
        const centerLatLng = new kakao.maps.LatLng(center.lat, center.lng);

        if (marker) marker.setMap(null);
        const newMarker = new kakao.maps.Marker({
            map: map,
            position: centerLatLng,
        });
        setMarker(newMarker);

        if (circle) circle.setMap(null);
        const newCircle = new kakao.maps.Circle({
            center: centerLatLng,
            radius: radius,
            strokeWeight: 1,
            strokeColor: '#007bff',
            strokeOpacity: 0.5,
            strokeStyle: 'solid',
            fillColor: '#007bff',
            fillOpacity: 0.2
        });
        newCircle.setMap(map);
        setCircle(newCircle);

        map.panTo(centerLatLng);
    }, [map, center, radius]);

    // 3. ✨ [수정됨] 주소 검색 기능 (Geocoder 사용)
    const handleKeywordSearch = (keyword) => {
        if (!isKakaoLoaded || !keyword.trim()) {
            setPlaces([]);
            return;
        }
        const kakao = window.kakao;
        const geocoder = new kakao.maps.services.Geocoder(); // Geocoder 객체 생성

        // 주소로 좌표를 검색합니다
        geocoder.addressSearch(keyword, function (result, status) {
            if (status === kakao.maps.services.Status.OK) {
                if (result.length === 1) {
                    // 결과가 하나면 바로 지도 이동
                    handlePlaceClick(result[0]);
                } else {
                    // 결과가 여러 개면 목록 표시
                    setPlaces(result);
                }
            } else {
                setPlaces([]);
                // 필요하다면 검색 결과가 없다는 알림을 추가할 수 있습니다.
                // alert('검색 결과가 없습니다.');
            }
        });
    };

    const handleInputChange = (e) => {
        setAddress(e.target.value);
    };

    const handleSearchClick = () => {
        handleKeywordSearch(address);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearchClick();
        }
    };

    // ✨ [수정됨] 검색 결과 클릭 핸들러
    const handlePlaceClick = (place) => {
        // Geocoder 결과 객체는 x, y 속성에 좌표 정보가 있습니다.
        const coords = { lat: parseFloat(place.y), lng: parseFloat(place.x) };
        setCenter(coords);
        // Geocoder 결과에는 place_name이 없으므로 address_name을 사용합니다.
        setAddress(place.address_name);
        setPlaces([]);
    };

    const handleRadiusChange = (e) => {
        setRadius(Number(e.target.value));
    };

    if (!isKakaoLoaded) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px', fontSize: '18px', color: '#666' }}>
                지도를 불러오는 중...
            </div>
        );
    }

    const handleRegisterClick = async () => {
        if (!center || !address) {
            alert('주소를 먼저 검색하고 선택해주세요.');
            return;
        }

        try {
            // API 호출
            const response = await fetch('http://localhost:4989/api/region/register', { // 백엔드 API 주소
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    address: address, // 현재 검색창에 표시된 주소
                    latitude: center.lat,
                    longitude: center.lng,
                }),
            });

            if (response.ok) {
                alert('주소와 좌표가 성공적으로 등록되었습니다.');
            } else {
                alert('등록에 실패했습니다.');
            }
        } catch (error) {
            console.error('API 호출 오류:', error);
            alert('서버와 통신 중 오류가 발생했습니다.');
        }
    };

    return (
        <div>
            <h1>지도 반경 설정 기능</h1>
            <SearchContainer>
                <SearchInput
                    type="text"
                    value={address}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="읍, 면, 동 단위의 주소를 검색하세요"
                />
                <SearchButton onClick={handleSearchClick}>검색</SearchButton>
                <SearchButton onClick={handleRegisterClick}>등록</SearchButton>
                {places.length > 0 && (
                    <ResultsContainer>
                        {/* ✨ [수정됨] Geocoder 결과 표시 */}
                        {places.map((place, index) => (
                            <ResultItem
                                key={`${place.address_name}-${index}`} // key를 더 고유하게 만듭니다.
                                onClick={() => handlePlaceClick(place)}
                            >
                                {place.address_name}
                            </ResultItem>
                        ))}
                    </ResultsContainer>
                )}
            </SearchContainer>

            <MapContainer id="map">
                <RadiusControl>
                    <Typography variant="body1">
                        반경: {radius}m
                    </Typography>
                    <RadiusInput
                        type="range"
                        min="100"
                        max="5000"
                        step="100"
                        value={radius}
                        onChange={handleRadiusChange}
                    />
                </RadiusControl>
            </MapContainer>

            {center && (
                <div style={{ marginTop: '20px', fontSize: '16px' }}>
                    <strong>현재 지도 중심 좌표:</strong>
                    <br />
                    위도 (lat): {center.lat}
                    <br />
                    경도 (lng): {center.lng}
                    <br />
                    반경: {radius}m
                </div>
            )}
        </div>
    );
};

export default MapComponent;
