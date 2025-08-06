package boot.sagu.service;

import java.util.List;

import boot.sagu.dto.CategoryDto;

public interface CategoryServiceInter {

	public List<CategoryDto> getParentCategory();
	public List<CategoryDto> getChildCategory(int parentId);
	
}
