import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  Pressable,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";

const HomeScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  const fetchTasks = async () => {
    const token = await AsyncStorage.getItem("access");
    axios
      .get(`${API_URL}/tasks/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setTasks(res.data))
      .catch((err) => console.error(err));
  };

  const fetchProfile = async () => {
    const token = await AsyncStorage.getItem("access");
    axios
      .get(`${API_URL}/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setProfile(res.data))
      .catch((err) => console.error(err));
  };

  const logout = async () => {
    await AsyncStorage.removeItem("access");
    await AsyncStorage.removeItem("refresh");
    navigation.replace("Login");
  };

  useEffect(() => {
    fetchTasks();
    fetchProfile();
  }, []);

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChangeProfile = async () => {
    const token = await AsyncStorage.getItem("access");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.cancelled) {
      const formData = new FormData();
      formData.append("profile_picture", {
        uri: result.assets[0].uri,
        name: "profile.jpg",
        type: "image/jpeg",
      });

      try {
        const res = await fetch(`${API_URL}/upload-picture/`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        });

        if (res.ok) {
          Alert.alert("Success", "Profile picture updated!");
          setShowProfilePopup(false);
          fetchProfile();
        } else {
          console.log("Upload failed", res);
          Alert.alert("Error", "Upload failed!");
        }
      } catch (err) {
        console.log("Upload error:", err);
        Alert.alert("Error", "Something went wrong.");
      }
    }
  };

  const toggleTaskStatus = async (task) => {
    const token = await AsyncStorage.getItem("access");
    const updatedStatus = task.status === "pending" ? "completed" : "pending";

    const payload = {
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      priority: task.priority,
      status: updatedStatus,
      assigned_to: task.assigned_to?.id,
    };

    try {
      await axios.put(`${API_URL}/tasks/update/${task.id}/`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      fetchTasks();
    } catch (error) {
      console.error("Error updating status:", error);
      Alert.alert("Error", "Failed to update task status");
    }
  };

  const deleteTask = async (id) => {
    const token = await AsyncStorage.getItem("access");
    try {
      await axios.delete(`${API_URL}/tasks/delete/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchTasks();
      Alert.alert("Deleted", "Task deleted successfully.");
    } catch (err) {
      console.log("Delete error:", err);
      Alert.alert("Error", "Failed to delete task.");
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={{ flex: 1 }} onPress={() => showProfilePopup && setShowProfilePopup(false)}>
        <View style={styles.header}>
          <Text style={styles.title}>📱 Task Manager</Text>

          <TouchableOpacity onPress={() => setShowProfilePopup(prev => !prev)}>
            {profile?.profile_picture ? (
              <Image source={{ uri: profile.profile_picture }} style={styles.profileImg} />
            ) : (
              <Text style={styles.noProfile}>👤</Text>
            )}
          </TouchableOpacity>

          {showProfilePopup && (
            <View style={styles.popup}>
              <TouchableOpacity onPress={handleChangeProfile}>
                <Text style={styles.popupItem}>Change Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                setShowProfilePopup(false);
                logout();
              }}>
                <Text style={[styles.popupItem, { color: 'red' }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View> 

        <TextInput
          placeholder="Search tasks..."
          style={styles.input}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={[styles.taskCard, {
              backgroundColor:
                item.status === "pending" ? "#ffe4b2" : "#d0f0c0",
            }]}>
              <View style={styles.titleRow}>
                <Text style={styles.taskTitle}>{item.title}</Text>
                <View style={styles.statusWrapper}>
                  <Text style={[styles.statusText, item.status === "pending" ? styles.pending : styles.completed]}>
                    {item.status === "pending" ? "Pending" : "Completed"}
                  </Text>
                </View>
              </View>

              <Text><Text style={{ fontWeight: "bold" }}>Deadline:</Text> {item.deadline} | <Text style={{ fontWeight: "bold" }}>Priority:</Text> {item.priority}</Text>
              <Text><Text style={{ fontWeight: "bold" }}>Created By:</Text> {item.created_by?.username} | <Text style={{ fontWeight: "bold" }}>Assigned:</Text> {item.assigned_to?.username}</Text>
              {/* <View style={styles.statusWrapper}>
                <Text style={[styles.statusText, item.status === "pending" ? styles.pending : styles.completed]}>
                  {item.status === "pending" ? "Pending" : "Completed"}
                </Text>
              </View> */}


              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.customButton, { backgroundColor: '#4CAF50' }]}
                  onPress={() => navigation.navigate("TaskForm", { task: item })}
                >
                  <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.customButton, { backgroundColor: '#2196F3' }]}
                  onPress={() => toggleTaskStatus(item)}
                >
                  <Text style={styles.buttonText}>Toggle</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.customButton, { backgroundColor: 'red' }]}
                  onPress={() => {
                    Alert.alert("Confirm", "Delete this task?", [
                      { text: "Cancel" },
                      {
                        text: "Delete",
                        onPress: () => deleteTask(item.id),
                      },
                    ]);
                  }}
                >
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </Pressable>

      <TouchableOpacity
        onPress={() => navigation.navigate("TaskForm")}
        style={styles.createBtn}
      >
        <Text style={styles.createBtnText}>Create Task</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    position: 'relative'
  },
  title: { fontSize: 24, fontWeight: "bold" },
  profileImg: { width: 40, height: 40, borderRadius: 20 },
  noProfile: { fontSize: 30 },
  popup: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 10,
    elevation: 5,
    zIndex: 1000
  },
  popupItem: { paddingVertical: 8 },
  input: { borderWidth: 1, padding: 8, marginBottom: 10, borderRadius: 6 },
  taskCard: { padding: 10, borderWidth: 1, marginBottom: 10, borderRadius: 8 },
  taskTitle: { fontSize: 18, fontWeight: "bold" },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10
  },
  customButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  createBtn: {
    backgroundColor: '#7ef673',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  createBtnText: { fontWeight: 'bold', color: '#000' },

  statusWrapper: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: 'bold',
    color: '#fff',
    overflow: 'hidden',
  },
  pending: {
    backgroundColor: '#ff9800', // orange
  },
  completed: {
    backgroundColor: '#4caf50', // green
  },

  titleRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 4,
},



});
