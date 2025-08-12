package boot.sagu.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
<<<<<<< HEAD
<<<<<<< HEAD
                .setAllowedOrigins("http://localhost:5173","http://192.168.10.136:4989");
=======
<<<<<<< HEAD
                .setAllowedOrigins("http://localhost:5173","http://:192.168.10.136:5173");
=======
                .setAllowedOrigins("http://localhost:5173","http://192.168.10.136:4989");
>>>>>>> 13d5c54 (zz)
>>>>>>> f5cace9 (4989)
=======
                .setAllowedOrigins("http://localhost:5173","http://:192.168.10.136:5173");
>>>>>>> 495e817 (4989)
    }
}
