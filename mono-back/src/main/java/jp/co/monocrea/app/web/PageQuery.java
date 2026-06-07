package jp.co.monocrea.app.web;

import java.util.List;
import jp.co.monocrea.core.page.PageRequest;
import org.jboss.resteasy.reactive.RestQuery;

/**
 * Binds the shared paging query parameters ({@code page}, {@code size}, repeated {@code sort}) so no
 * web annotations leak into {@code core}. Each {@code sort} value is one {@code "field,dir"} term.
 */
public class PageQuery {

    @RestQuery
    public int page = 0;

    @RestQuery
    public int size = PageRequest.DEFAULT_SIZE;

    @RestQuery
    public List<String> sort;

    public PageRequest toPageRequest() {
        return PageRequest.of(page, size, sort);
    }
}
