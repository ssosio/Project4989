package boot.sagu.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import boot.sagu.dto.PostsDto;
import boot.sagu.mapper.PostsMapper;

@RestController
@CrossOrigin(origins = "http://localhost:5176/")
public class AuctionController {
@Autowired
PostsMapper postsmapper;
@GetMapping("/auction")
public List<PostsDto> getAuctionList() {
	   return postsmapper.getAuctionPosts();
}

}
