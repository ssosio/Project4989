// src/main/java/boot/sagu/config/SecurityConfig.java
package boot.sagu.config;

import static org.springframework.security.config.Customizer.withDefaults;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;

import boot.sagu.service.CustomOAuth2UserService;
import boot.sagu.service.CustomUserDetailsService;
import boot.sagu.dto.MemberDto;
// ⬇️ 네 프로젝트의 CustomUserDetails 실제 경로로 바꿔주세요
import boot.sagu.config.CustomUserDetails;

@RequiredArgsConstructor
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService customUserDetailsService;
    private final CustomOAuth2UserService customOAuth2UserService;

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }

    // JWT 발급 → /auth/callback?token=...
    @Bean
    public AuthenticationSuccessHandler oAuth2LoginSuccessHandler() {
        return (request, response, authentication) -> {
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            MemberDto member = userDetails.getMember();
            String token = jwtUtil.generateToken(member); // ← 네 JwtUtil 시그니처에 맞게 유지
            response.sendRedirect("http://localhost:5173/auth/callback?token=" + token);
        };
    }

    // CORS (헤더 와일드카드 + Authorization 노출) — 유지/보강
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration c = new CorsConfiguration();
        c.setAllowedOrigins(java.util.List.of(
            "http://localhost:5173",
            "http://192.168.10.136:5173",
            "http://192.168.10.138:5173"
        ));
        c.setAllowedMethods(java.util.List.of("GET","POST","PUT","DELETE","PATCH","OPTIONS"));
        c.setAllowedHeaders(java.util.List.of("*"));
        c.setAllowCredentials(true);
        c.addExposedHeader("Authorization");
        UrlBasedCorsConfigurationSource s = new UrlBasedCorsConfigurationSource();
        s.registerCorsConfiguration("/**", c);
        return s;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(withDefaults())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            .authorizeHttpRequests(authz -> authz
                //  프리플라이트 허용(간헐적 401 예방)
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // 인증 필요한 경로
                .requestMatchers(HttpMethod.GET ,"/member/**").authenticated()
                .requestMatchers("/submit").authenticated()
                .requestMatchers("/auction/*/bids", "/auction/delete/**").authenticated()

                // 결제: webhook 공개, confirm은 인증 필요(명시)
                .requestMatchers(HttpMethod.POST, "/api/auctions/portone/webhook").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auctions/portone/confirm").authenticated()

                // 공개 경로
                .requestMatchers("/chat/**", "/chat/rooms/**", "/chat/rooms",
                                 "/unread-count/**", "/api/chat/**",
                                 "/room/create-with-message", "/room/enter", "/estate/**").permitAll()
                .requestMatchers("/ws/**").permitAll()
                .requestMatchers("/post/**", "/goods/**", "/cars/**").permitAll()
                .requestMatchers("/signup", "/login/**", "/oauth2/**", "/save/**", "/check-loginid").permitAll()
                .requestMatchers("/sms/**", "/find-id", "/verify-for-password-reset", "/reset-password").permitAll()
                .requestMatchers("/chatsave/**","/read").permitAll()
                .requestMatchers("/api/region/**","/api/member-region/**").permitAll()

                // 경매 조회/방(공개)
                .requestMatchers("/auction",
                                 "/auction/photos/**", "/auction/detail/**", "/auction/highest-bid/**",
                                 "/auction/image/**", "/auction/member/**", "/auction/favorite/count/**",
                                 "/auction/bid-history/**", "/auction/room/**").permitAll()
                
                .requestMatchers("/error").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/refresh").permitAll()

                // 그 외 모두 인증
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex.authenticationEntryPoint((req, res, e) -> {
                System.out.println("=== Security Exception Details ===");
                System.out.println("Request URI: " + req.getRequestURI());
                System.out.println("Request Method: " + req.getMethod());
                System.out.println("Authorization Header: " + req.getHeader("Authorization"));
                System.out.println("Error: " + e.getMessage());
                System.out.println("Error Type: " + e.getClass().getSimpleName());
                System.out.println("================================");
                res.setContentType("application/json;charset=UTF-8");
                res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                res.getWriter().write("{\"error\": \"Unauthorized\"}");
            }));

        // JWT 필터는 표준 위치: UsernamePasswordAuthenticationFilter “앞”
        http.addFilterBefore(new JwtAuthenticationFilter(jwtUtil, customUserDetailsService),
                UsernamePasswordAuthenticationFilter.class);

        // 구글 로그인
        http.oauth2Login(oauth2 -> oauth2
            .userInfoEndpoint(u -> u.userService(customOAuth2UserService))
            .successHandler(oAuth2LoginSuccessHandler())
        );

        return http.build();
    }
}
