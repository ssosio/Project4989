package boot.sagu.config;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import boot.sagu.service.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService customUserDetailsService;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, CustomUserDetailsService customUserDetailsService) {
        this.jwtUtil = jwtUtil;
        this.customUserDetailsService = customUserDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
    	 String uri = request.getRequestURI();
    	    String bearer = request.getHeader("Authorization");
    	    System.out.println("[JWT] uri = " + uri);
    	    System.out.println("[JWT] Authorization = " + bearer);

    	    try {
    	        String jwt = getJwtFromRequest(request); // "Bearer " 떼고 순수 토큰
    	        if (jwt != null) {
    	            String username = jwtUtil.extractUsername(jwt);
    	            System.out.println("[JWT] extractUsername = " + username);

    	            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
    	                // (선택) DB에서 사용자/권한 로드
    	                UserDetails user = customUserDetailsService.loadUserByUsername(username);

    	                boolean valid = jwtUtil.validateToken(jwt, user.getUsername());
    	                System.out.println("[JWT] validate = " + valid);

    	                if (valid) {
    	                    UsernamePasswordAuthenticationToken auth =
    	                        new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
    	                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
    	                    SecurityContextHolder.getContext().setAuthentication(auth);

    	                    System.out.println("[JWT] ✅ setAuthentication OK. principal=" + user.getUsername());
    	                } else {
    	                    System.out.println("[JWT] ❌ token invalid");
    	                }
    	            }
    	        } else {
    	            System.out.println("[JWT] no bearer token");
    	        }
    	    } catch (Exception e) {
    	        System.out.println("[JWT] ❌ exception: " + e.getClass().getSimpleName() + " - " + e.getMessage());
    	        // 예외가 나도 체인은 계속 흘려보냅니다. (EntryPoint가 401 응답)
    	    }

    	    filterChain.doFilter(request, response);
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
               requestURI.startsWith("/api/chat/") ||
               requestURI.startsWith("/save/");
    }
}