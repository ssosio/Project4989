package boot.sagu.service;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import boot.sagu.dto.CarDto;
import boot.sagu.dto.ItemDto;
import boot.sagu.dto.PhotoDto;
import boot.sagu.dto.PostsDto;
import boot.sagu.dto.RealEstateDto;
import boot.sagu.mapper.CarMapperInter;
import boot.sagu.mapper.CategoryMapperInter;
import boot.sagu.mapper.EstateMapperInter;
import boot.sagu.mapper.ItemMapperInter;
import boot.sagu.mapper.PhotoMapperInter;
import boot.sagu.mapper.PostsMapperInter;
import jakarta.servlet.http.HttpSession;

@Service
public class PostsService implements PostsServiceInter{
	
	@Autowired
	private PostsMapperInter postMapper;

	@Autowired
	private PhotoMapperInter photoMapper;
	
	@Autowired
	private CarMapperInter carMapper;
	
	@Autowired
	private EstateMapperInter estateMapper;
	
	@Autowired
	private ItemMapperInter itemMapper;
	
	@Autowired
	private CategoryMapperInter categoryMapper;
	
	@Override
	public void insertPost(PostsDto pdto) {
		// TODO Auto-generated method stub
		postMapper.insertPost(pdto);
		
	}

	@Override
	public List<PostsDto> getAllPostData() {
		// TODO Auto-generated method stub
		return postMapper.getAllPostData();
	}



	@Override
	public void insertPhoto(PhotoDto photoDto) {
		// TODO Auto-generated method stub
		photoMapper.insertPhoto(null);
	}

	@Override
	@Transactional
	public void insertPostWithPhoto(PostsDto pdto, List<MultipartFile> uploadFiles,HttpSession session,CarDto cdto,RealEstateDto rdto,ItemDto idto) {
		// TODO Auto-generated method stub
		
		System.out.println("=== 디버깅 정보 ===");
		System.out.println("전송받은 tradeType: [" + pdto.getTradeType() + "]");
		System.out.println("전송받은 postType: [" + pdto.getPostType() + "]");
		System.out.println("전송받은 title: [" + pdto.getTitle() + "]");
		System.out.println("전송받은 price: [" + pdto.getPrice() + "]");
		System.out.println("전송받은 content: [" + pdto.getContent() + "]");
		System.out.println("tradeType 길이: " + (pdto.getTradeType() != null ? pdto.getTradeType().length() : "null"));
		System.out.println("==================");
		
		// 값 검증 및 정리
		if (pdto.getTradeType() != null) {
			String cleanTradeType = pdto.getTradeType().trim().toUpperCase();
			if (cleanTradeType.equals("SALE") || cleanTradeType.equals("AUCTION") || cleanTradeType.equals("SHARE")) {
				pdto.setTradeType(cleanTradeType);
				System.out.println("검증된 tradeType: " + cleanTradeType);
			} else {
				System.out.println("잘못된 tradeType 값: " + pdto.getTradeType());
				throw new IllegalArgumentException("Invalid trade_type: " + pdto.getTradeType());
			}
		}
		
		postMapper.insertPost(pdto);
		System.out.println("생성된 postId = " + pdto.getPostId());
		System.out.println("▶▶ tradeType = " + pdto.getTradeType());
		
		String path=session.getServletContext().getRealPath("/save");
		
		List<PhotoDto> photoList=new ArrayList<>();
		
		if (uploadFiles != null && !uploadFiles.isEmpty()) {
		for(int i=0; i<uploadFiles.size(); i++) {
			MultipartFile file = uploadFiles.get(i);
			
			String fileName=file.getOriginalFilename();
			
			String saveName=new SimpleDateFormat("yyyyMMddHHmmss").format(new Date())+fileName;
			
			try {
				file.transferTo(new File(path+"\\"+saveName));
			} catch (IllegalStateException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			
			PhotoDto photo=new PhotoDto();
			photo.setPostId(pdto.getPostId());
			photo.setPhotoUrl(saveName);
			photo.setIsMain(i == 0 ? 1 : 0); // 첫 번째 사진을 메인으로 설정
			photoList.add(photo);
			
		}
		photoMapper.insertPhoto(photoList);
		}
		
		if("CARS".equals(pdto.getPostType())&& cdto!=null) {
			cdto.setPostId(pdto.getPostId());
			carMapper.insertCar(cdto);
			System.out.println("자동차정보");
		}
		
		if("REAL_ESTATES".equals(pdto.getPostType())&& rdto!=null) {
			rdto.setPostId(pdto.getPostId());
			estateMapper.insertEstate(rdto);
			System.out.println("부동산정보");
		}
		
		if("ITEMS".equals(pdto.getPostType())&&idto!=null) {
			idto.setPostId(pdto.getPostId());
			itemMapper.insertItem(idto);
			System.out.println("중고물품");
		}
	}


	@Override
	public List<Map<String, Object>> getPostListWithNick() {
		// TODO Auto-generated method stub
		return postMapper.getPostListWithNick();
	}

	@Override
	public Map<String, Object> getPostData(Long postId) {
		// TODO Auto-generated method stub
		return postMapper.getPostData(postId);
	}

	

	
	
	
}
