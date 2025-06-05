import React, { useEffect, useState, useRef  } from "react";
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
  Animated,
  Dimensions

} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";

import { Picker } from '@react-native-picker/picker';

const screenWidth = Dimensions.get('window').width;

const HomeScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  const [filter, setFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [filteredTasks, setFilteredTasks] = useState(tasks);

  const [pendingFilter, setPendingFilter] = useState("all");
  const [pendingPriorityFilter, setPendingPriorityFilter] = useState("all");
  const [pendingUserFilter, setPendingUserFilter] = useState("all");



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
    // console.log("in")
    const token = await AsyncStorage.getItem("access");
    axios
      .get(`${API_URL}/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setProfile(res.data))
      .catch((err) => console.error(err));
      // console.log(profile)
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

  useEffect(() => {
    const userId = profile?.id;
    const filtered = tasks.filter((task) => {
      const searchMatch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const statusMatch = filter === "all" || task.status === filter;
      const priorityMatch = priorityFilter === "all" || task.priority === priorityFilter;
      const roleMatch =
        userFilter === "all" ||
        (userFilter === "created" && task.created_by?.id === userId) ||
        (userFilter === "assigned" && task.assigned_to?.id === userId);

      return searchMatch && statusMatch && priorityMatch && roleMatch;
    });

    setFilteredTasks(filtered);
  }, [searchQuery, filter, priorityFilter, userFilter, tasks]);


  // filteredTasks = tasks.filter(task =>
  //   task.title.toLowerCase().includes(searchQuery.toLowerCase())
  // );

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



  // for filters start 
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;


  const openFilter = () => {
    setIsFilterOpen(true);
    Animated.timing(slideAnim, {
      toValue: 0, // Moves to visible screen area
      duration: 300,
      useNativeDriver: false,
    }).start();
  };


  const closeFilter = () => {
    Animated.timing(slideAnim, {
      toValue: Dimensions.get('window').width, // Moves back to right off-screen
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setIsFilterOpen(false);
    });
  };


  const applyFilters = () => {
    // console.log("pendin filter",pendingFilter)
    setFilter(pendingFilter);
    setPriorityFilter(pendingPriorityFilter);
    setUserFilter(pendingUserFilter);
    closeFilter();
  };


  const clearFilters = () => {
  setFilter("all");
  setPriorityFilter("all");
  setUserFilter("all");
  setFilteredTasks(tasks); // reset to original
  closeFilter();
};



  // for filters end 

  return (
    <View style={styles.container}>
      <Pressable style={{ flex: 1 }} onPress={() => showProfilePopup && setShowProfilePopup(false)}>
        <View style={styles.header}>
          <Text style={styles.title}>📱 Task Manager</Text>

          <TouchableOpacity onPress={() => setShowProfilePopup(prev => !prev)}>
            {profile?.profile_picture ? (
              <Image
                  source={{ uri: `${profile.profile_picture}?time=${new Date().getTime()}` }}
                  style={styles.profileImg}
                />
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
        {/* // Inside your component */}
        <View style={styles.filterView}>
          <TextInput
            placeholder="Search tasks..."
            style={styles.input}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.filterbutton} onPress={openFilter}>
            <Text style={styles.filterbuttonText}>Filter</Text>
          </TouchableOpacity>        
        </View>
        {/* Slide-in Filter Panel */}
        {isFilterOpen && (
          <Animated.View style={[styles.filterContainer, { transform: [{ translateX: slideAnim }] }]}>
            <View style={styles.panelContent}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={styles.filterheading}>Filter</Text>
                <TouchableOpacity onPress={closeFilter}>
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.label}>Filter by Status:</Text>
              <Picker
                selectedValue={pendingFilter}
                onValueChange={(itemValue) => setPendingFilter(itemValue)}
              >
                <Picker.Item label="All" value="all" />
                <Picker.Item label="Pending" value="pending" />
                <Picker.Item label="Completed" value="completed" />
              </Picker>

              <Text style={styles.label}>Priority:</Text>
              <Picker
                  selectedValue={pendingPriorityFilter}
                  onValueChange={(value) => setPendingPriorityFilter(value)}  // ✅ fix this
                >
                <Picker.Item label="All Priorities" value="all" />
                <Picker.Item label="Low" value="low" />
                <Picker.Item label="Medium" value="medium" />
                <Picker.Item label="High" value="high" />
              </Picker>

              <Text style={styles.label}>User Role:</Text>
              <Picker
                  selectedValue={pendingUserFilter}
                  onValueChange={(value) => setPendingUserFilter(value)} // ✅ fix this
                >

                <Picker.Item label="All" value="all" />
                <Picker.Item label="Created by Me" value="created" />
                <Picker.Item label="Assigned to Me" value="assigned" />
              </Picker>

              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Clear Filters</Text>
              </TouchableOpacity>

            </View>
          </Animated.View>
        )}
        

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

filterView: {
  flexDirection: 'row',
  alignItems: 'center',
  // paddingHorizontal: 10,
  marginBottom:5
},

  input: {
    flex: 1, // This makes it take remaining space
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
  },

  filterbutton: {
  paddingHorizontal: 16,
  paddingVertical: 10,
  backgroundColor: 'orange',
  borderRadius: 8,
  },

  filterbuttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  filterPanel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '80%',
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderLeftColor: '#ccc',
    elevation: 5,
    zIndex:100000
  },
  panelContent: {
    padding: 20,
    marginTop: 10,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  filterheading:{
    fontSize: 18,
    fontWeight: 'bold',
  },

  label: {
    fontSize: 16,
    marginTop: 10,
    color: '#333',
  },
  value: {
    fontSize: 14,
    marginBottom: 10,
    color: '#555',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  clearButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  closeText: {
    // textAlign: 'center',
    color: '#007AFF',
    // marginTop: 20,
  },

  applyButton: {
    backgroundColor: '#28a745', // Bootstrap success green
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },

  filterContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: '100%',
    width: '80%',
    backgroundColor: '#fff',
    zIndex: 999,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  }

});
