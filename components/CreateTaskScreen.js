import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Pressable,
  KeyboardAvoidingView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { API_URL } from "../config";

const screenWidth = Dimensions.get("window").width;

const CreateTaskScreen = ({ navigation, route }) => {
  const task = route.params?.task || null;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [selectedUsername, setSelectedUsername] = useState("");
  const [userOptions, setUserOptions] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: screenWidth - 40 });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const searchInputRef = useRef();
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setDeadline(task.deadline || "");
      setPriority(task.priority || "medium");
      setAssignedTo(task.assigned_to?.id?.toString() || "");
      setSelectedUsername(task.assigned_to?.username || "");
      setSearchText(task.assigned_to?.username || "");
    }
  }, [task]);

  useEffect(() => {
    navigation.setOptions({ title: task ? "Edit Task" : "Create Task" });
  }, [navigation, task]);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.measure((fx, fy, width, height, px, py) => {
        setDropdownPosition({ top: py + height, left: px, width });
      });
    }
  }, [searchText, userOptions]);

  const formatDate = (date) => date.toISOString().split("T")[0];

  const fetchUsers = async (search = "") => {
    const token = await AsyncStorage.getItem("access");
    try {
      const response = await fetch(`${API_URL}/getusers?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setUserOptions(data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const handleUserSearch = (text) => {
    setSearchText(text);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchUsers(text);
    }, 400);
  };

  const handleUserSelect = (user) => {
    setAssignedTo(user.id.toString());
    setSelectedUsername(user.username);
    setSearchText(user.username);
    setUserOptions([]);
    Keyboard.dismiss();
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) setDeadline(formatDate(selectedDate));
  };

  const handleSubmit = async () => {
    if (!title || !deadline || !assignedTo) {
      Alert.alert("Validation Error", "Please fill in all required fields.");
      return;
    }

    const token = await AsyncStorage.getItem("access");

    const payload = {
      title,
      description,
      status: "pending",
      deadline,
      priority,
      assigned_to: assignedTo,
    };

    const url = task
      ? `${API_URL}/tasks/update/${task.id}/`
      : `${API_URL}/tasks/create/`;

    const method = task ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.alert("Success", task ? "Task updated!" : "Task created!");
        if (!task) {
          setTitle("");
          setDescription("");
          setDeadline("");
          setPriority("medium");
          setAssignedTo("");
          setSelectedUsername("");
          setSearchText("");
        }
        navigation.goBack();
      } else {
        Alert.alert("Error", task ? "Failed to update task." : "Failed to create task.");
      }
    } catch (err) {
      console.error("Task submit error:", err);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.screen}>
          <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <Text style={styles.heading}>{task ? "Edit Task" : "Create New Task"}</Text>

            <TextInput
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />
            <TextInput
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              style={styles.input}
            />

            <View style={{ marginBottom: 5 }}>
              <Pressable onPress={() => setShowDatePicker(true)}>
                <TextInput
                  placeholder="Select deadline"
                  value={deadline}
                  editable={false}
                  style={styles.input}
                  pointerEvents="none"
                />
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={deadline ? new Date(deadline) : new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleDateChange}
                />
              )}
            </View>

            <View style={{ marginBottom: 5 }}>
              <TextInput
                placeholder="Search user..."
                value={searchText}
                onChangeText={handleUserSearch}
                style={styles.input}
                ref={searchInputRef}
              />
              {userOptions.length > 0 && (
                <View style={[styles.dropdown, { width: dropdownPosition.width }]}>
                  {userOptions.map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      onPress={() => handleUserSelect(user)}
                      style={styles.dropdownItem}
                      accessible={true}
                      accessibilityLabel={`Select user ${user.username}`}
                    >
                      <Text>{user.username}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <Text style={styles.label}>Priority:</Text>
            <View style={styles.priorityButtons}>
              {["low", "medium", "high"].map((level) => (
                <TouchableOpacity
                  key={level}
                  onPress={() => setPriority(level)}
                  style={[
                    styles.priorityButton,
                    priority === level && styles.prioritySelected,
                  ]}
                  accessible={true}
                  accessibilityLabel={`Select ${level} priority`}
                >
                  <Text style={priority === level ? styles.priorityTextSelected : styles.priorityText}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title={task ? "Update Task" : "Add Task"}
              onPress={handleSubmit}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: 20 },
  heading: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  label: { fontWeight: "bold", marginBottom: 5 },
  dropdown: {
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    maxHeight: 150,
    overflow: "hidden",
    elevation: 4,
    zIndex: 999,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  priorityButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  priorityButton: {
    padding: 10,
    borderRadius: 5,
    borderColor: "#ccc",
    borderWidth: 1,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 5,
  },
  prioritySelected: {
    backgroundColor: "#007bff",
  },
  priorityText: {
    color: "#000",
  },
  priorityTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default CreateTaskScreen;
