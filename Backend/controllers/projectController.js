const Project = require('../models/Project');

// Ajouter un projet
exports.addProject = async (req, res) => {
  try {
    const { name, date, completed, imageUrls, githubUrl, liveUrl, skillsUsed } = req.body;

    // Vérifiez que `imageUrls` est bien un tableau
    if (!Array.isArray(imageUrls)) {
      return res.status(400).json({ message: "Le champ 'imageUrls' doit être un tableau" });
    }

    const newProject = new Project({
      name,
      date,
      completed,
      imageUrls,
      githubUrl,
      liveUrl,
      skillsUsed,
    });

    await newProject.save();
    res.status(201).json({ message: 'Projet ajouté avec succès', project: newProject });
  } catch (error) {
    console.error("Erreur lors de l'ajout du projet :", error);
    res.status(400).json({ message: "Erreur lors de l'ajout du projet", error });
  }
};

// Récupérer tous les projets
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find();
    res.status(200).json(projects);
  } catch (error) {
    console.error("Erreur lors de la récupération des projets :", error);
    res.status(500).json({ message: "Erreur lors de la récupération des projets", error });
  }
};

// Récupérer un projet par ID
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Projet introuvable" });
    }
    res.status(200).json(project);
  } catch (error) {
    console.error("Erreur lors de la récupération du projet :", error);
    res.status(500).json({ message: "Erreur lors de la récupération du projet", error });
  }
};

// Mettre à jour un projet par ID
exports.updateProject = async (req, res) => {
  try {
    const { name, date, completed, imageUrls, githubUrl, liveUrl, skillsUsed } = req.body;

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { name, date, completed, imageUrls, githubUrl, liveUrl, skillsUsed },
      { new: true, runValidators: true } // Renvoie le document mis à jour
    );

    if (!updatedProject) {
      return res.status(404).json({ message: "Projet introuvable" });
    }

    res.status(200).json({ message: 'Projet mis à jour avec succès', project: updatedProject });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du projet :", error);
    res.status(400).json({ message: "Erreur lors de la mise à jour du projet", error });
  }
};

// Supprimer un projet par ID
exports.deleteProject = async (req, res) => {
  try {
    const deletedProject = await Project.findByIdAndDelete(req.params.id);

    if (!deletedProject) {
      return res.status(404).json({ message: "Projet introuvable" });
    }

    res.status(200).json({ message: 'Projet supprimé avec succès' });
  } catch (error) {
    console.error("Erreur lors de la suppression du projet :", error);
    res.status(500).json({ message: "Erreur lors de la suppression du projet", error });
  }
};