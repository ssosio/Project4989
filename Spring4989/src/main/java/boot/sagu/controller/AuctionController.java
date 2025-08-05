package boot.sagu.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import boot.sagu.dto.AuctionDto;
import boot.sagu.dto.PostsDto;
import boot.sagu.mapper.AuctionMapper;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5176", "http://localhost:5177"})
public class AuctionController {
@Autowired
AuctionMapper auctionmapper;

@GetMapping("/auction")
public List<PostsDto> getAuctionList() {
   return auctionmapper.getAuctionPosts();
}

@GetMapping("/auction/detail/{postId}")
public PostsDto getAuctionDetail(@PathVariable("postId") long postId) {
   PostsDto result = auctionmapper.getAuctionDetail(postId);
   if (result == null) {
       throw new RuntimeException("경매글을 찾을 수 없습니다: " + postId);
   }
   return result;
}

@GetMapping("/auction/highest-bid/{postId}")
public AuctionDto getHighestBid(@PathVariable("postId") long postId) {
   return auctionmapper.getHighestBid(postId);
}

@PostMapping("/auction/bid")
public String placeBid(@RequestBody AuctionDto auctionDto) {
   try {
       auctionmapper.insertBid(auctionDto);
       return "입찰이 성공적으로 등록되었습니다.";
   } catch (Exception e) {
       return "입찰 등록에 실패했습니다: " + e.getMessage();
   }
}

}
