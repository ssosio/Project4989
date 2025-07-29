package boot.sagu.palgu;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan("boot.sagu.*")
@MapperScan("boot.sagu.mapper")
public class Spring4989Application {

	public static void main(String[] args) {
		SpringApplication.run(Spring4989Application.class, args);
	}

}
