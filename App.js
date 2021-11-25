import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  ScrollView,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Dimensions } from "react-native";
import * as Location from "expo-location";

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const CARD_HEIGHT = 220;
const CARD_WIDTH = windowWidth * 0.8;

export default function App() {
  const [userLocation, setUserLocation] = useState();
  const [busLine, setBusLine] = useState("");
  const [busInfo, setBusInfo] = useState([]);
  const [loading, setLoading] = useState(false);
  const moveAnim = useRef(new Animated.Value(CARD_HEIGHT)).current;
  const mapRef = useRef();

  useEffect(() => {
    const status = async () => {
      setLoading(true);
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.granted) {
        const last = await Location.getLastKnownPositionAsync();
        if (!last) {
          const loc = await Location.getCurrentPositionAsync();
          setUserLocation(loc.coords);
          setLoading(false);
        } else {
          setLoading(false);
          setUserLocation(last.coords);
        }
      }
    };
    status();
  }, []);

  const animatedStyle = { transform: [{ translateY: moveAnim }] };

  const handleClick = async () => {
    try {
      const { data } = await axios({
        method: "POST",
        url: "http://montevideo.gub.uy/buses/rest/stm-online",
        data: {
          empresa: "50", // CUTCSA
          lineas: [busLine],
        },
      });

      setBusInfo(data.features);
      console.log(busInfo);

      Animated.timing(moveAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
      //console.log(busInfo);
    } catch (error) {
      console.log("error", error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.map}>
        {loading ? (
          <View style={styles.spinner}>
            <ActivityIndicator
              size="large"
              color="#ff5050"
              style={{ position: "absolute", margin: 100 }}
            ></ActivityIndicator>
          </View>
        ) : (
          <View style={styles.map}>
            {userLocation ? (
              <MapView
                style={{ width: windowWidth, height: windowHeight }}
                initialRegion={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
                showsMyLocationButton={true}
                ref={mapRef}
              >
                {busInfo ? (
                  <Marker
                    coordinate={{
                      latitude: userLocation.latitude,
                      longitude: userLocation.longitude,
                    }}
                    image={require("./userPin.png")}
                  ></Marker>
                ) : null}
                {busInfo
                  ? busInfo.map((busI) => {
                      return (
                        <Marker
                          key={busI.properties.id}
                          coordinate={{
                            latitude: busI.geometry.coordinates[1],
                            longitude: busI.geometry.coordinates[0],
                          }}
                          image={require("./bus.png")}
                        ></Marker>
                      );
                    })
                  : null}
              </MapView>
            ) : null}
            <View style={styles.search}>
              <TextInput
                style={styles.input}
                placeholder="Buscá tu bus"
                value={busLine}
                onChangeText={(e) => setBusLine(e)}
              ></TextInput>
              <TouchableOpacity style={styles.button} onPress={handleClick}>
                <Text style={styles.textBtn}>Buscar</Text>
              </TouchableOpacity>
            </View>
            {busInfo ? (
              <Animated.View style={[styles.card, animatedStyle]}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                  {busInfo.map((busI) => (
                    <View style={styles.textContent} key={busI.properties.id}>
                      <TouchableOpacity
                        onPress={() => {
                          mapRef.current.animateToRegion(
                            {
                              latitude: busI.geometry.coordinates[1],
                              longitude: busI.geometry.coordinates[0],
                              latitudeDelta: 0.02,
                              longitudeDelta: 0.02,
                            },

                            2000
                          );
                        }}
                      >
                        <Text numberOfLines={1} style={styles.iasdem}>
                          {busI.properties.linea} {busI.properties.destinoDesc}{" "}
                          {busI.properties.sublinea}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </Animated.View>
            ) : null}
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  spinner: {
    flex: 1,
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
  },
  map: {
    flex: 1,
    alignContent: "stretch",
  },
  container: {
    flex: 1,
    position: "absolute",
  },
  search: {
    flex: 1,
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
    marginHorizontal: 40,
    flexDirection: "row",
  },
  button: {
    padding: 12,
    borderRadius: 4,
    backgroundColor: "#ff5050",
    elevation: 100,
    color: "white",
    marginLeft: 30,
  },
  textBtn: {
    color: "white",
  },
  input: {
    height: 40,
    borderRadius: 10,
    backgroundColor: "white",
    padding: 6,
    width: 250,
  },

  card: {
    flex: 1,
    alignSelf: "center",
    position: "absolute",
    elevation: 2,
    bottom: 0,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowRadius: 5,
    shadowOpacity: 0.3,
    shadowOffset: { x: 2, y: -2 },
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
  },

  textContent: {
    flex: 1,
  },

  iasdem: {
    width: "100%",
    padding: 12,
    fontSize: 10,

    justifyContent: "center",
    alignItems: "center",
  },
});
