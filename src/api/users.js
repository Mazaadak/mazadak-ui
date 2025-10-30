import apiClient from "../lib/apiClient";

export const usersAPI = {
  getUser: (id) => apiClient.get(`/users/${id}`),
  updateUser: (userId, updateData) => apiClient.patch(`/users/${userId}`, updateData),
  uploadPersonalPhoto: (userId, file) => {
    const formData = new FormData();
    formData.append('personal-photo', file);
    
    return apiClient.post('/users/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  changePassword: (userId, oldPassword, newPassword) => {
    return apiClient.post('/users/change-password', 
      { oldPassword, newPassword }
    );
  },
  sendEmailOtp: async (userId, email) => {
    const response = await apiClient.post(`/users/get-otp/${email}`, {});
    return response.data;
  },
  
  deleteUser: async (userId) => {
    const response = await apiClient.delete('/users');
    return response.data;
  },
}