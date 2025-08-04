import { useEffect, useState } from 'react';

const useKakaoLoader = () => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // 카카오맵 API가 이미 로드되었는지 확인
        const checkKakaoLoaded = () => {
            if (window.kakao && window.kakao.maps) {
                setIsLoaded(true);
            } else {
                // API가 아직 로드되지 않았다면 잠시 후 다시 확인
                setTimeout(checkKakaoLoaded, 100);
            }
        };

        checkKakaoLoaded();
    }, []);

    return isLoaded;
};

export default useKakaoLoader;
