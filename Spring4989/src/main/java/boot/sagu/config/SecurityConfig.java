package boot.sagu.config;

import static org.springframework.security.config.Customizer.withDefaults;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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

import boot.sagu.dto.MemberDto;
import boot.sagu.service.CustomOAuth2UserService;
import boot.sagu.service.CustomUserDetailsService;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private CustomOAuth2UserService customOAuth2UserService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    // 소셜 로그인 성공 시 JWT를 생성하고 프론트엔드로 리다이렉트하는 핸들러
    @Bean
    public AuthenticationSuccessHandler oAuth2LoginSuccessHandler() {
        return (request, response, authentication) -> {
            // OAuth2 인증 과정에서 생성된 CustomUserDetails 객체를 가져옵니다.
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            MemberDto member = userDetails.getMember();

            // JWT 토큰을 생성합니다.
            String token = jwtUtil.generateToken(member);

            // 사용자를 프론트엔드의 특정 경로로 리다이렉트시키면서 토큰을 쿼리 파라미터로 전달합니다.
            // React에서는 이 경로에서 토큰을 받아 localStorage에 저장하게 됩니다.
            response.sendRedirect("http://localhost:5173/auth/callback?token=" + token);
        };
    }

    
    //크로스오리진 대체
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.addAllowedOrigin("http://localhost:5173"); // 프론트엔드 주소
        configuration.addAllowedMethod("*");
        configuration.addAllowedHeader("*");
        configuration.setAllowCredentials(true); // 필요시

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(withDefaults()) // CORS 설정 추가
            // CSRF 보호 기능 비활성화
            .csrf(csrf -> csrf.disable())
            
            // 세션을 사용하지 않는 STATELESS 방식으로 설정 (JWT 사용을 위함)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // HTTP 요청에 대한 접근 권한 설정
            .authorizeHttpRequests(authz -> authz
            	.requestMatchers("/ws/**","/post/**").permitAll()
                // '/signup', '/login', 소셜로그인 관련 경로, 이미지 경로는 인증 없이 누구나 접근 가능
                .requestMatchers("/signup", "/login/**", "/oauth2/**", "/save/**", "/check-loginid","/ws/**").permitAll()
                // SMS 인증 및 아이디/비밀번호 찾기 관련 API는 인증 없이 접근 가능
                .requestMatchers("/sms/**", "/find-id", "/verify-for-password-reset", "/reset-password").permitAll()
                .requestMatchers("/chatsave/**","/read").permitAll()
                .requestMatchers("/api/region/register").permitAll()
                // 경매 조회용 API는 인증 불필요
                .requestMatchers("/auction/photos/**", "/auction/detail/**", "/auction/highest-bid/**", "/auction/image/**").permitAll()
                // 경매 삭제 API는 인증 필요
                .requestMatchers("/auction/delete/**").authenticated()
                // 그 외의 모든 요청은 반드시 인증을 거쳐야 함
                .anyRequest().authenticated()
            )
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setContentType("application/json;charset=UTF-8");
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("{\"error\": \"Unauthorized\"}");
                })
            )
            .addFilterBefore(new JwtAuthenticationFilter(jwtUtil, customUserDetailsService), UsernamePasswordAuthenticationFilter.class)
            
            // OAuth2 로그인 설정
            .oauth2Login(oauth2 -> oauth2
                // 로그인 성공 후 사용자 정보를 처리할 서비스를 등록
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService)
                )
                // 로그인 성공 시 실행될 핸들러를 등록
                .successHandler(oAuth2LoginSuccessHandler())
            );
            
        return http.build();
    }
}