package com.dev2gether.service;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RoomService {
    private final Map<String, Set<String>> rooms = new HashMap<>();

    public synchronized void joinRoom(String roomId, String user) {
        rooms.computeIfAbsent(roomId, k -> new HashSet<>()).add(user);
    }


    public synchronized void leaveRoom(String roomId, String user) {
        Set<String> set = rooms.get(roomId);

        if (set != null) {
            set.remove(user);
            if (set.isEmpty()) {
                rooms.remove(roomId);
            }
        }
    }

    public synchronized Set<String> getUsers(String roomId) {

        return rooms.getOrDefault(roomId, Collections.emptySet());
    }

    public synchronized  boolean roomExists(String roomId){
        return rooms.containsKey(roomId);
    }
}


