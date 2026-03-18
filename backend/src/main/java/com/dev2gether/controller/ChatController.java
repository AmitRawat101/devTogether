package com.dev2gether.controller;

import com.dev2gether.dto.*;
import com.dev2gether.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.*;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final RoomService roomService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${onecompiler.api.key}")
    private String apiKey;


    // ================= CHAT =================
    @MessageMapping("/chatMessage")
    public void handleChatMessage(ChatMessage message) {

        if (message.roomId() == null) return;

        ChatMessage msg = new ChatMessage(
                message.roomId(),
                message.sender(),
                message.text(),
                System.currentTimeMillis()
        );

        messagingTemplate.convertAndSend(
                "/topic/" + message.roomId(),
                Map.of("chatMessage", msg)
        );
    }
    // ================= JOIN =================
    @MessageMapping("/join")
    public void handleJoin(JoinRequest req) {

        roomService.joinRoom(req.roomId(), req.userName());

        List<String> users = new ArrayList<>(roomService.getUsers(req.roomId()));

        messagingTemplate.convertAndSend(
                "/topic/" + req.roomId(),
                Map.of("userJoined", users)
        );
    }

    // ================= CODE CHANGE =================
    @MessageMapping("/codeChange")
    public void handleCodeChange(CodeChangeRequest req) {

        messagingTemplate.convertAndSend(
                "/topic/" + req.roomId(),
                Map.of("codeUpdate", req.code())
        );
    }

    // ================= LEAVE =================
    @MessageMapping("/leaveRoom")
    public void handleLeave(JoinRequest req) {

        roomService.leaveRoom(req.roomId(), req.userName());

        List<String> users = new ArrayList<>(roomService.getUsers(req.roomId()));

        messagingTemplate.convertAndSend(
                "/topic/" + req.roomId(),
                Map.of("userJoined", users)
        );
    }

    // ================= TYPING =================
    @MessageMapping("/typing")
    public void handleTyping(TypingRequest req) {

        messagingTemplate.convertAndSend(
                "/topic/" + req.roomId(),
                Map.of("userTyping", req.userName())
        );
    }

    // ================= LANGUAGE =================
    @MessageMapping("/languageChange")
    public void handleLanguageChange(LanguageChangeRequest req) {

        messagingTemplate.convertAndSend(
                "/topic/" + req.roomId(),
                Map.of("languageUpdate", req.language())
        );
    }

    // ================= COMPILE CODE =================
    @MessageMapping("/compileCode")
    public void handleCompile(CompileRequest req) {

        if (!roomService.roomExists(req.roomId())) return;

        String url = "https://api.onecompiler.com/v1/run";

        Map<String, Object> body = new HashMap<>();
        body.put("language", req.language());
        body.put("stdin", "");

        Map<String, String> file = new HashMap<>();
        file.put("name", "main." + getExtension(req.language()));
        file.put("content", req.code());

        body.put("files", List.of(file));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-API-Key", apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {

            Map<?, ?> response = restTemplate.postForObject(
                    url,
                    entity,
                    Map.class
            );

            messagingTemplate.convertAndSend(
                    "/topic/" + req.roomId(),
                    Map.of("codeResponse", response)
            );

        } catch (Exception e) {

            Map<String, String> error = Map.of(
                    "error", "Compilation failed"
            );

            messagingTemplate.convertAndSend(
                    "/topic/" + req.roomId(),
                    Map.of("codeResponse", error)
            );
        }
    }

    private String getExtension(String language) {

        return switch (language) {
            case "python" -> "py";
            case "javascript" -> "js";
            case "java" -> "java";
            case "cpp" -> "cpp";
            default -> "txt";
        };
    }
}
