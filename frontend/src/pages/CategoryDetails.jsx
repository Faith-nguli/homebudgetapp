// import React, { useEffect, useState, useContext } from "react";
// import { CategoryContext } from "../context/CategoryContext";
// import { useParams } from "react-router-dom";
// import { toast } from "react-toastify";

// const CategoryDetail = () => {
//   const { categoryId } = useParams(); // Get categoryId from the URL
//   const { fetchCategoryById } = useContext(CategoryContext);
//   const [category, setCategory] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (!categoryId) {
//       setError("Invalid category ID.");
//       setLoading(false);
//       return;
//     }

//     const loadCategory = async () => {
//       try {
//         console.log("Fetching category with ID:", categoryId);
//         const data = await fetchCategoryById(categoryId);
//         if (data) {
//           setCategory(data);
//         } else {
//           setError("Category not found.");
//         }
//       } catch (error) {
//         setError("Error fetching category.");
//         toast.error("Error fetching category.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadCategory();
//   }, [categoryId, fetchCategoryById]);

//   if (loading) return <p>Loading...</p>;
//   if (error) return <p>{error}</p>;
//   if (!category) return <p>No category found.</p>;

//   return (
//     <div className="category-detail">
//       <h2>{category.name}</h2>
//       {category.image_url && <img src={category.image_url} alt={category.name} className="category-image" />}
//       <p>Limit: KES {category.limit}</p>
//       <p>Current Spent: KES {category.current_spent}</p>
//       <p className={`status ${category.current_spent > category.limit ? "over-budget" : "within-budget"}`}>
//         {category.current_spent > category.limit ? "Over Budget!" : "Within Budget"}
//       </p>
//     </div>
//   );
// };

// export default CategoryDetail;

// // Update fetchCategoryById function inside CategoryContext
// export const fetchCategoryById = async (categoryId) => {
//   try {
//     if (!categoryId) throw new Error("Invalid category ID.");

//     const token = localStorage.getItem("token");
//     if (!token) throw new Error("No authentication token found.");

//     const response = await fetch(`http://127.0.0.1:5000/categories/${categoryId}`, {
//       method: "GET",
//       headers: {
//         "Authorization": `Bearer ${token}`,
//         "Content-Type": "application/json"
//       }
//     });

//     if (!response.ok) {
//       throw new Error("Failed to fetch category.");
//     }

//     return await response.json();
//   } catch (error) {
//     console.error("Fetch single category error:", error);
//     toast.error("Error fetching category.");
//     return null;
//   }
// };
