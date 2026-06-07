package jp.co.monocrea.feature.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jp.co.monocrea.core.entity.SoftDeletableEntity;

@Entity
@Table(name = "users")
public class User extends SoftDeletableEntity {

    @Column(name = "login_id", nullable = false)
    private String loginId;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    public String getLoginId() {
        return loginId;
    }

    public void setLoginId(String loginId) {
        this.loginId = loginId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
}
