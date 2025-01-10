package org.example.model;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
@Entity //Indique que la classe est une entité JPA

public class Role{
    @Id //clé primaire de l'entité.
    @GeneratedValue(strategy = GenerationType.IDENTITY) //la valeur de la clé primaire est générée automatiquement,
    private int idRole;

    private String nom;

    private String description;

    private boolean status;

    public Role() {}

    public Role(int idRole, String nom, String description, boolean status){
        this.idRole = idRole;
        this.nom = nom;
        this.description = description;
        this.status = status;
    }

    public int getIdRole(){
        return idRole;
    }

    public void setIdRole(int idRole){
        this.idRole = idRole;
    }

    public String getNom(){
        return nom;
    }

    public void setNom(String nom){
        this.nom = nom;
    }

    public String getDescription(){
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isStatus() {
        return status;
    }

    public void setStatus(boolean status) {
        this.status = status;
    }

    public void creerRole(){
        System.out.println("creer un nouveau rôle.");
    }

    public void modifierRole(){
        System.out.println("modifier le rôle d'un utilisateur");
    }

    public void supprimerRole(){
        System.out.println("supprimer un rôle");
    }

    public String obtenirPermissions(){
        return "Liste des permissions associées au rôle";
    }
}
