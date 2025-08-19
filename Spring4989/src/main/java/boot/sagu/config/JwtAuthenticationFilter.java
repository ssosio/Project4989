package boot.sagu.config;

import boot.sagu.config.JwtUtil;
import boot.sagu.service.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService customUserDetailsService;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, CustomUserDetailsService customUserDetailsService) {
        this.jwtUtil = jwtUtil;
        this.customUserDetailsService = customUserDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String requestURI = request.getRequestURI();
        System.out.println("JWT Filter - Processing request: " + requestURI);
        
        try {
            // 1. JWT 토큰 추출
            String jwt = getJwtFromRequest(request);
            
            // 2. 토큰이 있으면 검증
            if (StringUtils.hasText(jwt)) {
                // 3. 토큰에서 사용자명 추출
                String username = jwtUtil.extractUsername(jwt);
                
                if (StringUtils.hasText(username) && SecurityContextHolder.getContext().getAuthentication() == null) {
                    // 4. 사용자 정보 로드
                    UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);
                    
                    // 5. 토큰 유효성 검사
                    if (jwtUtil.validateToken(jwt, userDetails.getUsername())) {
                        // 6. 인증 객체 생성 및 SecurityContext에 설정
                        UsernamePasswordAuthenticationToken authentication = 
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        
                        // 추가 상세 로깅
                        System.out.println("JWT Filter - Authentication successful for user: " + username);
                        System.out.println("JWT Filter - SecurityContext authentication: " + SecurityContextHolder.getContext().getAuthentication());
                        System.out.println("JWT Filter - SecurityContext authorities: " + SecurityContextHolder.getContext().getAuthentication().getAuthorities());
                        System.out.println("JWT Filter - SecurityContext is authenticated: " + SecurityContextHolder.getContext().getAuthentication().isAuthenticated());
                    } else {
                        System.out.println("JWT Filter - Token validation failed for user: " + username);
                    }
                }
            }
        } catch (Exception e) {
            System.out.println("JWT Filter - Error processing JWT: " + e.getMessage());
            // 에러가 발생해도 필터 체인은 계속 진행
        }
        
        System.out.println("JWT Filter - Before filterChain.doFilter for: " + requestURI);
        filterChain.doFilter(request, response);
        System.out.println("JWT Filter - After filterChain.doFilter for: " + requestURI);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String requestURI = request.getRequestURI();
        
        // 인증이 필요하지 않은 경로들
        return requestURI.startsWith("/login") ||
               requestURI.startsWith("/signup") ||
               requestURI.startsWith("/oauth2") ||
               requestURI.startsWith("/sms") ||
               requestURI.startsWith("/find-id") ||
               requestURI.startsWith("/verify-for-password-reset") ||
               requestURI.startsWith("/reset-password") ||
               requestURI.startsWith("/check-loginid") ||
               requestURI.startsWith("/ws") ||
               requestURI.startsWith("/post") ||
               requestURI.startsWith("/chatsave") ||
               requestURI.startsWith("/read") ||
               requestURI.startsWith("/api/region/register") ||
               requestURI.startsWith("/chat/") ||
               requestURI.startsWith("/api/chat/");
    }
}